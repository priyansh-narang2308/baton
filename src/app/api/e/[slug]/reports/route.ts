import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/server/db/client";
import { CATEGORIES } from "@/server/db/schema";
import { attendeeReports, DomainError, submitReport } from "@/server/domain/incidents";
import { applyEffects } from "@/server/domain/projection";
import { body, clientIp, handle, rateLimit } from "@/server/http";
import { ensureAttendee, eventBySlug, eventZones, nexconnApi } from "@/server/services";
import { getSession, setSession } from "@/server/session";

const AttendeeReport = z.object({
  category: z.enum(CATEGORIES),
  zone: z.string().max(60).nullable(), // zone slug from the QR poster
  text: z.string().trim().max(500).default(""),
});

/** Anonymous attendee report (no account). Rate-limited per IP and per attendee. */
export async function POST(req: Request, ctx: RouteContext<"/api/e/[slug]/reports">) {
  return handle(async () => {
    const { slug } = await ctx.params;
    const ev = await eventBySlug(slug);
    if (!ev) throw new DomainError("not_found", "Event not found");
    rateLimit(`report-ip:${clientIp(req)}`, 30, 60_000);
    const input = await body(req, AttendeeReport);
    const zone = input.zone ? (await eventZones(ev.id)).find((z) => z.slug === input.zone) : undefined;
    if (input.zone && !zone) throw new DomainError("invalid", "Unknown location on this poster");

    const session = await getSession("attendee", ev.id);
    const attendee = await ensureAttendee(ev.id, session?.id);
    if (!session || session.id !== attendee.id) await setSession({ role: "attendee", id: attendee.id, eventId: ev.id });
    rateLimit(`report-attendee:${attendee.id}`, 6, 60_000);

    const r = await submitReport(db(), {
      eventId: ev.id,
      source: "attendee",
      attendeeId: attendee.id,
      zoneId: zone?.id ?? null,
      category: input.category,
      text: input.text,
      structured: Boolean(zone), // zone from the poster + category from a chip
    });
    const projection = await applyEffects(db(), nexconnApi(), r.effects);
    return NextResponse.json({ reportId: r.reportId, incidentId: r.incidentId, outcome: r.outcome, reportCount: r.reportCount, eventId: ev.id, projected: projection.ok }, { status: 201 });
  });
}

/** The attendee's own reports with live status (authoritative; DMs only trigger refreshes). */
export async function GET(_req: Request, ctx: RouteContext<"/api/e/[slug]/reports">) {
  return handle(async () => {
    const { slug } = await ctx.params;
    const ev = await eventBySlug(slug);
    if (!ev) throw new DomainError("not_found", "Event not found");
    const session = await getSession("attendee", ev.id);
    if (!session) return NextResponse.json({ eventId: ev.id, reports: [] });
    const rows = await attendeeReports(db(), session.id);
    return NextResponse.json(
      {
        eventId: ev.id,
        reports: rows.map((r) => ({ ...r, createdAt: r.createdAt.getTime(), claimedAt: r.claimedAt?.getTime() ?? null, resolvedAt: r.resolvedAt?.getTime() ?? null })),
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  });
}
