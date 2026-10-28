import { and, eq } from "drizzle-orm";
import type { Db } from "../db/client";
import { attendees, events, incidents, members, notifications, reports, zones } from "../db/schema";

/**
 * Event impact report — computed only from recorded data. Simulated (demo) activity is counted separately
 * and never mixed into the real numbers.
 */

export type ImpactIncident = {
  id: string;
  zoneId: string | null;
  category: string;
  priority: "normal" | "urgent";
  origin: "report" | "chat";
  status: "open" | "claimed" | "resolved" | "withdrawn";
  ownerMemberId: string | null;
  escalationLevel: number;
  createdAt: Date;
  claimedAt: Date | null;
  resolvedAt: Date | null;
};
export type ImpactReport = { incidentId: string; source: "attendee" | "crew"; attendeeId: string | null; memberId: string | null; simulated: boolean; createdAt: Date };
export type ImpactInput = {
  incidents: ImpactIncident[];
  reports: ImpactReport[];
  zones: { id: string; name: string }[];
  crew: { id: string; name: string; isSimulated: boolean }[];
  notifiedAttendees: number;
  now: Date;
};

export type Duration = { medianSec: number | null; p90Sec: number | null; samples: number };

export type Impact = {
  totals: {
    reports: number;
    incidents: number;
    duplicatesAbsorbed: number;
    open: number;
    claimed: number;
    resolved: number;
    fromChat: number;
    escalated: number;
    attendeeReporters: number;
    attendeesNotified: number;
    attendeesClosedLoop: number;
  };
  timeToClaim: Duration;
  timeToFix: Duration;
  oldestOpenSec: number | null;
  byZone: { zoneId: string | null; name: string; incidents: number; reports: number; open: number; timeToClaim: Duration }[];
  byCategory: { category: string; incidents: number; reports: number }[];
  responders: { memberId: string; name: string; claimed: number; resolved: number; simulated: boolean }[];
  timeline: { start: number; reports: number; resolved: number }[];
  simulated: { reports: number; share: number };
};

export function percentile(sorted: number[], p: number): number | null {
  if (sorted.length === 0) return null;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

function duration(values: number[]): Duration {
  const sorted = values.filter((v) => v >= 0).sort((a, b) => a - b);
  return { medianSec: percentile(sorted, 50), p90Sec: percentile(sorted, 90), samples: sorted.length };
}

const sec = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 1000);

export function computeImpact(input: ImpactInput): Impact {
  const live = input.incidents.filter((i) => i.status !== "withdrawn");
  const liveIds = new Set(live.map((i) => i.id));
  const allReports = input.reports.filter((r) => liveIds.has(r.incidentId));
  const reps = allReports.filter((r) => !r.simulated);
  const incById = new Map(live.map((i) => [i.id, i]));
  // An incident is "real" when at least one real report backs it.
  const real = live.filter((i) => reps.some((r) => r.incidentId === i.id));

  const claimDur = (list: ImpactIncident[]) => duration(list.filter((i) => i.claimedAt).map((i) => sec(i.createdAt, i.claimedAt!)));
  const reporters = new Set(reps.filter((r) => r.source === "attendee" && r.attendeeId).map((r) => r.attendeeId!));
  const closedLoop = new Set(
    reps.filter((r) => r.source === "attendee" && r.attendeeId && incById.get(r.incidentId)?.status === "resolved").map((r) => r.attendeeId!),
  );
  const open = real.filter((i) => i.status === "open");

  const zoneName = new Map(input.zones.map((z) => [z.id, z.name]));
  const zoneKeys = [...new Set(real.map((i) => i.zoneId))];
  const byZone = zoneKeys
    .map((zoneId) => {
      const list = real.filter((i) => i.zoneId === zoneId);
      const ids = new Set(list.map((i) => i.id));
      return {
        zoneId,
        name: zoneId ? (zoneName.get(zoneId) ?? "Unknown zone") : "No location",
        incidents: list.length,
        reports: reps.filter((r) => ids.has(r.incidentId)).length,
        open: list.filter((i) => i.status === "open").length,
        timeToClaim: claimDur(list),
      };
    })
    .sort((a, b) => b.reports - a.reports || a.name.localeCompare(b.name));

  const byCategory = [...new Set(real.map((i) => i.category))]
    .map((category) => {
      const ids = new Set(real.filter((i) => i.category === category).map((i) => i.id));
      return { category, incidents: ids.size, reports: reps.filter((r) => ids.has(r.incidentId)).length };
    })
    .sort((a, b) => b.reports - a.reports);

  const responders = input.crew
    .map((m) => ({
      memberId: m.id,
      name: m.name,
      simulated: m.isSimulated,
      claimed: real.filter((i) => i.ownerMemberId === m.id && i.claimedAt).length,
      resolved: real.filter((i) => i.ownerMemberId === m.id && i.status === "resolved").length,
    }))
    .filter((r) => r.claimed + r.resolved > 0)
    .sort((a, b) => b.resolved - a.resolved || b.claimed - a.claimed);

  // Timeline: ≤ 24 equal buckets from the first report to now (or the last resolution).
  const times = reps.map((r) => r.createdAt.getTime());
  let timeline: Impact["timeline"] = [];
  if (times.length) {
    const start = Math.min(...times);
    const end = Math.max(start + 60_000, input.now.getTime());
    const step = Math.max(60_000, Math.ceil((end - start) / 24 / 60_000) * 60_000);
    const n = Math.min(24, Math.ceil((end - start) / step));
    timeline = Array.from({ length: n }, (_, k) => ({ start: start + k * step, reports: 0, resolved: 0 }));
    const bucket = (t: number) => timeline[Math.min(n - 1, Math.max(0, Math.floor((t - start) / step)))];
    for (const t of times) bucket(t).reports++;
    for (const i of real) if (i.resolvedAt) bucket(i.resolvedAt.getTime()).resolved++;
  }

  const simulatedReports = allReports.length - reps.length;
  return {
    totals: {
      reports: reps.length,
      incidents: real.length,
      duplicatesAbsorbed: Math.max(0, reps.length - real.length),
      open: open.length,
      claimed: real.filter((i) => i.status === "claimed").length,
      resolved: real.filter((i) => i.status === "resolved").length,
      fromChat: real.filter((i) => i.origin === "chat").length,
      escalated: real.filter((i) => i.escalationLevel > 0).length,
      attendeeReporters: reporters.size,
      attendeesNotified: input.notifiedAttendees,
      attendeesClosedLoop: closedLoop.size,
    },
    timeToClaim: claimDur(real),
    timeToFix: duration(real.filter((i) => i.resolvedAt).map((i) => sec(i.createdAt, i.resolvedAt!))),
    oldestOpenSec: open.length ? Math.max(...open.map((i) => sec(i.createdAt, input.now))) : null,
    byZone,
    byCategory,
    responders,
    timeline,
    simulated: { reports: simulatedReports, share: allReports.length ? simulatedReports / allReports.length : 0 },
  };
}

/** Loads one event's data and computes its impact report. */
export async function eventImpact(db: Db, eventId: string, now = new Date()) {
  const [ev] = await db.select().from(events).where(eq(events.id, eventId));
  if (!ev) return null;
  const [incs, reps, zs, crew, atts, notified] = await Promise.all([
    db.select().from(incidents).where(eq(incidents.eventId, eventId)),
    db.select().from(reports).where(eq(reports.eventId, eventId)),
    db.select({ id: zones.id, name: zones.name }).from(zones).where(eq(zones.eventId, eventId)),
    db.select({ id: members.id, name: members.name, isSimulated: members.isSimulated }).from(members).where(eq(members.eventId, eventId)),
    db.select({ id: attendees.id, isSimulated: attendees.isSimulated }).from(attendees).where(eq(attendees.eventId, eventId)),
    db.selectDistinct({ recipient: notifications.recipient }).from(notifications).innerJoin(incidents, eq(incidents.id, notifications.incidentId)).innerJoin(attendees, eq(attendees.nexconnUserId, notifications.recipient)).where(and(eq(incidents.eventId, eventId), eq(attendees.isSimulated, false))),
  ]);
  const simAttendee = new Set(atts.filter((a) => a.isSimulated).map((a) => a.id));
  const simMember = new Set(crew.filter((m) => m.isSimulated).map((m) => m.id));
  const impact = computeImpact({
    incidents: incs,
    reports: reps.map((r) => ({
      incidentId: r.incidentId,
      source: r.source,
      attendeeId: r.attendeeId,
      memberId: r.memberId,
      simulated: (r.attendeeId ? simAttendee.has(r.attendeeId) : false) || (r.memberId ? simMember.has(r.memberId) : false),
      createdAt: r.createdAt,
    })),
    zones: zs,
    crew,
    notifiedAttendees: notified.length,
    now,
  });
  return { event: { id: ev.id, name: ev.name, isDemo: ev.isDemo, status: ev.status, createdAt: ev.createdAt }, impact };
}
