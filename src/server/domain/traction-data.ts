import { inArray, sql } from "drizzle-orm";
import type { Db } from "../db/client";
import { attendees, events, incidentEvents, incidents, members, reports, tractionConsoleSnapshots, tractionExclusions, tractionFeedback, tractionPilots } from "../db/schema";
import { computeTraction, DAY_MS, type ConnectionRow, type MessageRow, type Range, type TractionResult } from "./traction";

/**
 * Loads the rows behind /traction and computes the public metrics. Only verified pilot events are read in detail;
 * webhook payloads are reduced in SQL to the few fields that are counted, so message text never leaves the database.
 */
export async function loadTraction(db: Db, range: Range, now = new Date()): Promise<TractionResult> {
  const [pilots, snapshots, feedback, exclusions] = await Promise.all([
    db.select().from(tractionPilots),
    db.select().from(tractionConsoleSnapshots),
    db.select().from(tractionFeedback),
    db.select({ id: tractionExclusions.nexconnUserId }).from(tractionExclusions),
  ]);
  const ids = pilots.map((p) => p.eventId);
  const empty = ids.length === 0;

  // The previous window is read too, so rolling ranges can show an honest comparison.
  const since = new Date(range.start.getTime() - (range.end.getTime() - range.start.getTime()) - DAY_MS);

  const [evs, crew, atts, incs, reps, audit, msgs, conns] = empty
    ? [[], [], [], [], [], [], [], []]
    : await Promise.all([
        db.select({ id: events.id, isDemo: events.isDemo, nexconnGroupId: events.nexconnGroupId, botUserId: events.botUserId }).from(events).where(inArray(events.id, ids)),
        db.select({ id: members.id, eventId: members.eventId, nexconnUserId: members.nexconnUserId, isSimulated: members.isSimulated }).from(members).where(inArray(members.eventId, ids)),
        db.select({ id: attendees.id, eventId: attendees.eventId, nexconnUserId: attendees.nexconnUserId, isSimulated: attendees.isSimulated }).from(attendees).where(inArray(attendees.eventId, ids)),
        db.select({ id: incidents.id, eventId: incidents.eventId, status: incidents.status, createdAt: incidents.createdAt, claimedAt: incidents.claimedAt, resolvedAt: incidents.resolvedAt }).from(incidents).where(inArray(incidents.eventId, ids)),
        db.select({ id: reports.id, incidentId: reports.incidentId, attendeeId: reports.attendeeId, memberId: reports.memberId, attachedBy: reports.attachedBy, createdAt: reports.createdAt }).from(reports).where(inArray(reports.eventId, ids)),
        db
          .select({ incidentId: incidentEvents.incidentId, actor: incidentEvents.actor, type: incidentEvents.type, at: incidentEvents.at })
          .from(incidentEvents)
          .innerJoin(incidents, sql`${incidents.id} = ${incidentEvents.incidentId}`)
          .where(inArray(incidents.eventId, ids)),
        db.execute<{ message_id: string; user_id: string; channel_id: string; channel_type: number; os: string | null; t: string }>(sql`
          select x->>'messageId' as message_id, x->>'userId' as user_id, x->>'channelId' as channel_id,
                 (x->>'channelType')::int as channel_type, x->>'os' as os,
                 coalesce(nullif(x->>'time', ''), w.payload->>'time') as t
          from webhook_events w, jsonb_array_elements(w.payload->'data') x
          where w.type = 'message:send' and w.created_at >= ${since.toISOString()}::timestamptz and x ? 'messageId'`),
        db.execute<{ user_id: string; status: string; t: string }>(sql`
          select x->>'userId' as user_id, x->>'status' as status, x->>'time' as t
          from webhook_events w, jsonb_array_elements(w.payload->'data') x
          where w.type = 'user:connection_status' and w.created_at >= ${since.toISOString()}::timestamptz`),
      ]);

  const messages: MessageRow[] = (msgs as { message_id: string; user_id: string; channel_id: string; channel_type: number; os: string | null; t: string }[])
    .filter((m) => m.message_id && m.user_id && m.t)
    .map((m) => ({ messageId: m.message_id, userId: m.user_id, channelId: m.channel_id, channelType: Number(m.channel_type), os: m.os ?? undefined, time: new Date(Number(m.t)) }));
  const connections: ConnectionRow[] = (conns as { user_id: string; status: string; t: string }[])
    .filter((c) => c.user_id && c.t)
    .map((c) => ({ userId: c.user_id, status: String(c.status), time: new Date(Number(c.t)) }));

  return computeTraction({
    now,
    range,
    pilots,
    events: evs,
    people: [...crew.map((m) => ({ ...m, kind: "crew" as const })), ...atts.map((a) => ({ ...a, kind: "attendee" as const }))],
    excludedUserIds: exclusions.map((e) => e.id),
    incidents: incs,
    reports: reps,
    audit,
    messages,
    connections,
    snapshots,
    feedback,
  });
}
