import { after, NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { DomainError, listIncidents } from "@/server/domain/incidents";
import { crewActor, handle } from "@/server/http";
import { eventById, eventCrew, eventZones } from "@/server/services";
import { presenceFor } from "@/server/domain/presence";
import { runWorkerTick } from "@/server/worker";

/** Authoritative read model for crew and board. Clients call this on load, on reconnect and on metadata gaps. */
export async function GET(req: Request, ctx: RouteContext<"/api/events/[eventId]/state">) {
  return handle(async () => {
    const { eventId } = await ctx.params;
    const meId = await crewActor(eventId, req);
    const ev = await eventById(eventId);
    if (!ev) throw new DomainError("not_found", "Event not found");
    const [incidents, crew, zones] = await Promise.all([listIncidents(db(), eventId), eventCrew(eventId), eventZones(eventId)]);
    const me = crew.find((m) => m.id === meId);
    const presence = await presenceFor(db(), crew.map((m) => m.nexconnUserId));
    // On serverless hosts there is no always-on worker; open crew pages drive escalation instead (see runWorkerTick).
    if (process.env.BATON_DISABLE_WORKER === "1") after(runWorkerTick);
    return NextResponse.json(
      {
        event: { id: ev.id, name: ev.name, slug: ev.slug, status: ev.status, groupId: ev.nexconnGroupId, botUserId: ev.botUserId, isDemo: ev.isDemo },
        me: me ? { id: me.id, name: me.name, role: me.role, zoneId: me.zoneId, nexconnUserId: me.nexconnUserId } : null,
        crew: crew.map((m) => ({ id: m.id, name: m.name, role: m.role, zoneId: m.zoneId, onDuty: m.onDuty, nexconnUserId: m.nexconnUserId, isSimulated: m.isSimulated, online: presence.tracked ? presence.online.has(m.nexconnUserId) : null })),
        zones: zones.map((z) => ({ id: z.id, name: z.name, slug: z.slug })),
        incidents: incidents.map((i) => ({
          id: i.id,
          number: i.number,
          title: i.title,
          origin: i.origin,
          category: i.category,
          priority: i.priority,
          status: i.status,
          zoneId: i.zoneId,
          zoneName: i.zoneName,
          ownerMemberId: i.ownerMemberId,
          ownerName: i.ownerName,
          passToMemberId: i.passToMemberId,
          passToName: i.passToName,
          passNote: i.passNote,
          passOfferedAt: i.passOfferedAt?.getTime() ?? null,
          reportCount: i.reportCount,
          version: i.version,
          cardMessageId: i.cardMessageId,
          escalationLevel: i.escalationLevel,
          createdAt: i.createdAt.getTime(),
          claimedAt: i.claimedAt?.getTime() ?? null,
          resolvedAt: i.resolvedAt?.getTime() ?? null,
          suggestion: i.suggestion,
        })),
        serverTime: Date.now(),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  });
}
