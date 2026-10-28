import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db/client";
import { attendees } from "@/server/db/schema";
import { DomainError, submitReport } from "@/server/domain/incidents";
import { applyEffects } from "@/server/domain/projection";
import { newId, nexconnUserId } from "@/server/ids";
import { body, handle } from "@/server/http";
import { eventById, eventZones, nexconnApi } from "@/server/services";
import { getSession } from "@/server/session";

const Simulate = z.object({
  zone: z.string().max(60),
  category: z.enum(["supplies", "cleanliness", "tech"]),
  texts: z.array(z.string().max(200)).min(1).max(3),
});

/**
 * Demo-only: adds reports from clearly-flagged simulated attendees so a single judge can see consolidation.
 * Uses the real intake, consolidation and projection path — only the reporters are simulated.
 */
export async function POST(req: Request, ctx: RouteContext<"/api/demo/[eventId]/simulate">) {
  return handle(async () => {
    const { eventId } = await ctx.params;
    const ev = await eventById(eventId);
    if (!ev?.isDemo) throw new DomainError("forbidden", "Simulation is only available in demo events");
    if (!(await getSession("organizer", eventId))) throw new DomainError("forbidden", "Open the demo from its organizer view");
    const input = await body(req, Simulate);
    const zone = (await eventZones(eventId)).find((z) => z.slug === input.zone);
    const results = [];
    for (const text of input.texts) {
      const id = newId.attendee();
      await db().insert(attendees).values({ id, eventId, nexconnUserId: nexconnUserId.attendee(id), isSimulated: true });
      const r = await submitReport(db(), { eventId, source: "attendee", attendeeId: id, zoneId: zone?.id ?? null, category: input.category, text, structured: Boolean(zone) });
      await applyEffects(db(), nexconnApi(), r.effects);
      results.push({ outcome: r.outcome, reportCount: r.reportCount, incidentId: r.incidentId });
    }
    return NextResponse.json({ results });
  });
}
