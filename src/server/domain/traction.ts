/**
 * Public traction metrics (/traction). Pure functions only: the loader in `traction-data.ts` reads the database and
 * hands rows to `computeTraction`, so every number on the page is unit-tested.
 *
 * The rules that keep the numbers honest:
 * - Only events an admin has verified as a pilot or rehearsal count. Demo events never count, even if verified.
 * - Simulated identities, the event's bot and identities on the exclusion list never count as participants.
 * - Messages are counted once per Nexconn message id, however many webhook deliveries carried them.
 * - Messages sent by the server (bot cards, status updates) are reported separately from messages people sent.
 * - Nexconn MAU is never computed here. It is only ever the figure an admin copied from the Nexconn Console.
 */

export const DAY_MS = 24 * 60 * 60 * 1000;

/** The Nexconn Build Challenge window, the page's default reporting period. */
export const CHALLENGE_START = new Date("2026-10-23T00:00:00Z");

export const RANGE_KEYS = ["challenge", "30d", "7d"] as const;
export type RangeKey = (typeof RANGE_KEYS)[number];

export type Range = { key: RangeKey; label: string; start: Date; end: Date };

export function resolveRange(key: string | undefined, now: Date): Range {
  const k: RangeKey = (RANGE_KEYS as readonly string[]).includes(key ?? "") ? (key as RangeKey) : "challenge";
  const today = startOfUtcDay(now);
  if (k === "7d") return { key: k, label: "Last 7 days", start: new Date(today.getTime() - 6 * DAY_MS), end: now };
  if (k === "30d") return { key: k, label: "Last 30 days", start: new Date(today.getTime() - 29 * DAY_MS), end: now };
  return { key: k, label: "Challenge to date", start: CHALLENGE_START, end: now };
}

export function startOfUtcDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

// ── Input rows ─────────────────────────────────────────────────────────────────────────────────────────────────────

export type PilotRow = { eventId: string; kind: "pilot" | "rehearsal"; publicName: string; publicContext: string; startsAt: Date; endsAt: Date };
export type EventRow = { id: string; isDemo: boolean; nexconnGroupId: string; botUserId: string };
export type PersonRow = { id: string; eventId: string; nexconnUserId: string; isSimulated: boolean; kind: "crew" | "attendee" };
export type IncidentRow = { id: string; eventId: string; status: "open" | "claimed" | "resolved" | "withdrawn"; createdAt: Date; claimedAt: Date | null; resolvedAt: Date | null };
export type ReportRow = { id: string; incidentId: string; attendeeId: string | null; memberId: string | null; attachedBy: "new" | "auto" | "merge"; createdAt: Date };
export type AuditRow = { incidentId: string; actor: string; type: string; at: Date };
/** One `message:send` item from a stored webhook envelope. */
export type MessageRow = { messageId: string; userId: string; channelId: string; channelType: number; os?: string; groupUserIds?: string[]; time: Date };
/** One `user:connection_status` item: status "0" = connected. */
export type ConnectionRow = { userId: string; status: string; time: Date };
export type SnapshotRow = { id: string; metric: "mau" | "dau" | "messages"; value: number; periodStart: Date; periodEnd: Date; consolePath: string; capturedAt: Date };
export type FeedbackRow = { id: string; eventId: string | null; role: "organizer" | "lead" | "volunteer" | "attendee"; quote: string; rating: number | null; attribution: "anonymous" | "role" | "name"; attributionName: string | null; published: boolean; collectedAt: Date };

export type TractionInput = {
  now: Date;
  range: Range;
  pilots: PilotRow[];
  events: EventRow[];
  people: PersonRow[];
  excludedUserIds: string[];
  incidents: IncidentRow[];
  reports: ReportRow[];
  audit: AuditRow[];
  messages: MessageRow[];
  connections: ConnectionRow[];
  snapshots: SnapshotRow[];
  feedback: FeedbackRow[];
};

// ── Output ─────────────────────────────────────────────────────────────────────────────────────────────────────────

export type Duration = { medianSec: number | null; p90Sec: number | null; samples: number };
export type Delta = { previous: number; change: number } | null;
export type DayPoint = { day: number; active: number; messages: number; reported: number; resolved: number; passes: number };

export type TractionResult = {
  generatedAt: number;
  range: { key: RangeKey; label: string; start: number; end: number };
  /** Latest data point that went into the numbers (null when there is none yet). */
  dataThrough: number | null;
  console: {
    mau: SnapshotRow | null;
    history: SnapshotRow[];
  };
  headline: {
    activeParticipants: number;
    activeParticipantsDelta: Delta;
    crew: number;
    attendees: number;
    userMessages: number;
    userMessagesDelta: Delta;
    systemMessages: number;
    pilotEvents: number;
    rehearsals: number;
    activeEvents: number;
    incidentsReported: number;
    incidentsResolved: number;
  };
  impact: {
    requests: number;
    incidents: number;
    claimed: number;
    resolved: number;
    duplicatesConsolidated: number;
    handoversOffered: number;
    handoversAccepted: number;
    timeToClaim: Duration;
    timeToResolve: Duration;
  };
  lifecycle: { open: number; claimed: number; resolved: number; withdrawn: number };
  responseBuckets: { label: string; claim: number; resolve: number }[];
  daily: DayPoint[];
  pilots: {
    kind: "pilot" | "rehearsal";
    name: string;
    context: string;
    startsAt: number;
    endsAt: number;
    crew: number;
    attendees: number;
    requests: number;
    incidents: number;
    resolved: number;
    userMessages: number;
    medianClaimSec: number | null;
    feedbackCount: number;
  }[];
  feedback: { id: string; quote: string; who: string; rating: number | null; pilot: string | null; collectedAt: number }[];
};

// ── Helpers ────────────────────────────────────────────────────────────────────────────────────────────────────────

export function percentile(sorted: number[], p: number): number | null {
  if (sorted.length === 0) return null;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

function duration(values: number[]): Duration {
  const sorted = values.filter((v) => v >= 0).sort((a, b) => a - b);
  return { medianSec: percentile(sorted, 50), p90Sec: percentile(sorted, 90), samples: sorted.length };
}

const secBetween = (a: Date, b: Date) => Math.round((b.getTime() - a.getTime()) / 1000);
const inWindow = (t: Date, start: Date, end: Date) => t.getTime() >= start.getTime() && t.getTime() <= end.getTime();

const BUCKETS: { label: string; maxSec: number }[] = [
  { label: "Under 1 min", maxSec: 60 },
  { label: "1–5 min", maxSec: 300 },
  { label: "5–15 min", maxSec: 900 },
  { label: "15–60 min", maxSec: 3600 },
  { label: "Over 1 hour", maxSec: Infinity },
];

const ROLE_LABEL: Record<FeedbackRow["role"], string> = { organizer: "Organizer", lead: "Crew lead", volunteer: "Volunteer", attendee: "Attendee" };

// GroupChannel = 3 and DirectChannel = 1 in Nexconn's webhook `channelType`.
const GROUP = 3;
const DIRECT = 1;

// ── The computation ────────────────────────────────────────────────────────────────────────────────────────────────

export function computeTraction(input: TractionInput): TractionResult {
  const { range } = input;

  // 1. Verified, non-demo pilot events only.
  const eventById = new Map(input.events.map((e) => [e.id, e]));
  const pilots = input.pilots.filter((p) => {
    const ev = eventById.get(p.eventId);
    return ev && !ev.isDemo;
  });
  const pilotIds = new Set(pilots.map((p) => p.eventId));
  const groupToEvent = new Map<string, string>();
  const bots = new Set<string>();
  for (const id of pilotIds) {
    const ev = eventById.get(id)!;
    groupToEvent.set(ev.nexconnGroupId, id);
    bots.add(ev.botUserId);
  }

  // 2. External participants: real people in those events, minus exclusions.
  const excluded = new Set(input.excludedUserIds);
  const people = input.people.filter((p) => pilotIds.has(p.eventId) && !p.isSimulated && !excluded.has(p.nexconnUserId) && !bots.has(p.nexconnUserId));
  const personByNexconn = new Map(people.map((p) => [p.nexconnUserId, p]));
  const personById = new Map(people.map((p) => [p.id, p]));

  // 3. Incidents and reports in pilot events.
  const incidents = input.incidents.filter((i) => pilotIds.has(i.eventId));
  const incidentById = new Map(incidents.map((i) => [i.id, i]));
  const reports = input.reports.filter((r) => {
    if (!incidentById.has(r.incidentId)) return false;
    const by = r.attendeeId ?? r.memberId;
    return by ? personById.has(by) : false; // reports from simulated or excluded identities don't count
  });
  const audit = input.audit.filter((a) => incidentById.has(a.incidentId));

  // An incident counts when a counted person reported it. Withdrawn ones stay in the lifecycle but not in totals.
  const reportedIncidentIds = new Set(reports.map((r) => r.incidentId));
  const counted = incidents.filter((i) => reportedIncidentIds.has(i.id));

  // 4. Messages: one per Nexconn message id, in a pilot group or a direct chat with a pilot participant.
  const seen = new Set<string>();
  type Msg = MessageRow & { eventId: string; system: boolean };
  const messages: Msg[] = [];
  for (const m of input.messages) {
    if (seen.has(m.messageId)) continue;
    let eventId: string | undefined;
    if (m.channelType === GROUP) eventId = groupToEvent.get(m.channelId);
    else if (m.channelType === DIRECT) eventId = personByNexconn.get(m.userId)?.eventId ?? personByNexconn.get(m.channelId)?.eventId;
    if (!eventId) continue;
    const system = m.os === "Server" || bots.has(m.userId);
    if (!system && !personByNexconn.has(m.userId)) continue; // a simulated or excluded sender
    seen.add(m.messageId);
    messages.push({ ...m, eventId, system });
  }

  // 5. Activity per person per day (sent a message, reported, acted on an incident, or connected).
  const activity: { userId: string; at: Date; eventId: string }[] = [];
  for (const m of messages) if (!m.system) activity.push({ userId: m.userId, at: m.time, eventId: m.eventId });
  for (const r of reports) {
    const p = personById.get((r.attendeeId ?? r.memberId)!)!;
    activity.push({ userId: p.nexconnUserId, at: r.createdAt, eventId: p.eventId });
  }
  for (const a of audit) {
    const p = personById.get(a.actor);
    if (p) activity.push({ userId: p.nexconnUserId, at: a.at, eventId: p.eventId });
  }
  for (const c of input.connections) {
    const p = personByNexconn.get(c.userId);
    if (p && c.status === "0") activity.push({ userId: c.userId, at: c.time, eventId: p.eventId });
  }

  const distinctActive = (start: Date, end: Date) => new Set(activity.filter((a) => inWindow(a.at, start, end)).map((a) => a.userId));
  const activeSet = distinctActive(range.start, range.end);
  const userMsgsIn = (start: Date, end: Date) => messages.filter((m) => !m.system && inWindow(m.time, start, end)).length;

  // Trends only for rolling windows, and only when the previous window had data to compare with.
  let activeDelta: Delta = null;
  let messagesDelta: Delta = null;
  if (range.key !== "challenge") {
    const len = range.end.getTime() - range.start.getTime();
    const prevStart = new Date(range.start.getTime() - len);
    const prevEnd = new Date(range.start.getTime() - 1);
    const prevActive = distinctActive(prevStart, prevEnd).size;
    const prevMsgs = userMsgsIn(prevStart, prevEnd);
    if (prevActive > 0) activeDelta = { previous: prevActive, change: activeSet.size - prevActive };
    if (prevMsgs > 0) messagesDelta = { previous: prevMsgs, change: userMsgsIn(range.start, range.end) - prevMsgs };
  }

  // 6. Range-scoped incident numbers (incidents created in the window).
  const inRange = counted.filter((i) => inWindow(i.createdAt, range.start, range.end));
  const live = inRange.filter((i) => i.status !== "withdrawn");
  const liveIds = new Set(live.map((i) => i.id));
  const rangeReports = reports.filter((r) => liveIds.has(r.incidentId));
  const claimTimes = live.filter((i) => i.claimedAt).map((i) => secBetween(i.createdAt, i.claimedAt!));
  const resolveTimes = live.filter((i) => i.resolvedAt).map((i) => secBetween(i.createdAt, i.resolvedAt!));
  const rangeAudit = audit.filter((a) => inWindow(a.at, range.start, range.end));

  const responseBuckets = BUCKETS.map((b, k) => {
    const lo = k === 0 ? -1 : BUCKETS[k - 1].maxSec;
    const fits = (s: number) => s > lo && s <= b.maxSec;
    return { label: b.label, claim: claimTimes.filter(fits).length, resolve: resolveTimes.filter(fits).length };
  });

  // 7. Daily series across the window, in UTC days. Starts at the first day with data so the chart has no empty lead-in.
  const firstData = Math.min(
    ...[...activity.map((a) => a.at.getTime()), ...inRange.map((i) => i.createdAt.getTime())].filter((t) => t >= range.start.getTime()),
  );
  const seriesStart = range.key === "challenge" && Number.isFinite(firstData) ? startOfUtcDay(new Date(firstData)) : startOfUtcDay(range.start);
  const daily: DayPoint[] = [];
  const hasAnyData = activity.length > 0 || counted.length > 0;
  if (hasAnyData) {
    for (let t = seriesStart.getTime(); t <= range.end.getTime(); t += DAY_MS) {
      const s = new Date(t);
      const e = new Date(t + DAY_MS - 1);
      daily.push({
        day: t,
        active: distinctActive(s, e).size,
        messages: userMsgsIn(s, e),
        reported: counted.filter((i) => i.status !== "withdrawn" && inWindow(i.createdAt, s, e)).length,
        resolved: counted.filter((i) => i.resolvedAt && inWindow(i.resolvedAt, s, e)).length,
        passes: audit.filter((a) => a.type === "pass.accepted" && inWindow(a.at, s, e)).length,
      });
    }
  }

  // 8. Per-pilot cards (whole-event figures, not range-scoped: a pilot is reported as it happened).
  const feedback = input.feedback.filter((f) => f.published && (f.eventId === null || pilotIds.has(f.eventId)));
  const pilotCards = pilots
    .map((p) => {
      const ppl = people.filter((x) => x.eventId === p.eventId);
      const incs = counted.filter((i) => i.eventId === p.eventId && i.status !== "withdrawn");
      const ids = new Set(incs.map((i) => i.id));
      const claim = duration(incs.filter((i) => i.claimedAt).map((i) => secBetween(i.createdAt, i.claimedAt!)));
      return {
        kind: p.kind,
        name: p.publicName,
        context: p.publicContext,
        startsAt: p.startsAt.getTime(),
        endsAt: p.endsAt.getTime(),
        crew: ppl.filter((x) => x.kind === "crew").length,
        attendees: new Set(reports.filter((r) => ids.has(r.incidentId) && r.attendeeId).map((r) => r.attendeeId)).size,
        requests: reports.filter((r) => ids.has(r.incidentId)).length,
        incidents: incs.length,
        resolved: incs.filter((i) => i.status === "resolved").length,
        userMessages: messages.filter((m) => !m.system && m.eventId === p.eventId).length,
        medianClaimSec: claim.medianSec,
        feedbackCount: feedback.filter((f) => f.eventId === p.eventId).length,
      };
    })
    .sort((a, b) => b.startsAt - a.startsAt);

  const pilotName = new Map(pilots.map((p) => [p.eventId, p.publicName]));
  const activeEvents = new Set(activity.filter((a) => inWindow(a.at, range.start, range.end)).map((a) => a.eventId));

  // 9. Console snapshots: the latest MAU figure by capture date; never substituted with anything computed here.
  const snapshots = [...input.snapshots].sort((a, b) => b.capturedAt.getTime() - a.capturedAt.getTime());
  const mau = snapshots.find((s) => s.metric === "mau") ?? null;

  const dataPoints = [...activity.map((a) => a.at.getTime()), ...counted.flatMap((i) => [i.createdAt, i.claimedAt, i.resolvedAt].filter(Boolean).map((d) => d!.getTime()))];

  return {
    generatedAt: input.now.getTime(),
    range: { key: range.key, label: range.label, start: range.start.getTime(), end: range.end.getTime() },
    dataThrough: dataPoints.length ? Math.max(...dataPoints) : null,
    console: { mau, history: snapshots },
    headline: {
      activeParticipants: activeSet.size,
      activeParticipantsDelta: activeDelta,
      crew: [...activeSet].filter((u) => personByNexconn.get(u)?.kind === "crew").length,
      attendees: [...activeSet].filter((u) => personByNexconn.get(u)?.kind === "attendee").length,
      userMessages: userMsgsIn(range.start, range.end),
      userMessagesDelta: messagesDelta,
      systemMessages: messages.filter((m) => m.system && inWindow(m.time, range.start, range.end)).length,
      pilotEvents: pilots.filter((p) => p.kind === "pilot").length,
      rehearsals: pilots.filter((p) => p.kind === "rehearsal").length,
      activeEvents: activeEvents.size,
      incidentsReported: live.length,
      incidentsResolved: live.filter((i) => i.status === "resolved").length,
    },
    impact: {
      requests: rangeReports.length,
      incidents: live.length,
      claimed: live.filter((i) => i.claimedAt).length,
      resolved: live.filter((i) => i.status === "resolved").length,
      duplicatesConsolidated: rangeReports.filter((r) => r.attachedBy !== "new").length,
      handoversOffered: rangeAudit.filter((a) => a.type === "pass.offered").length,
      handoversAccepted: rangeAudit.filter((a) => a.type === "pass.accepted").length,
      timeToClaim: duration(claimTimes),
      timeToResolve: duration(resolveTimes),
    },
    lifecycle: {
      open: inRange.filter((i) => i.status === "open").length,
      claimed: inRange.filter((i) => i.status === "claimed").length,
      resolved: inRange.filter((i) => i.status === "resolved").length,
      withdrawn: inRange.filter((i) => i.status === "withdrawn").length,
    },
    responseBuckets,
    daily,
    pilots: pilotCards,
    feedback: feedback
      .sort((a, b) => b.collectedAt.getTime() - a.collectedAt.getTime())
      .map((f) => ({
        id: f.id,
        quote: f.quote,
        rating: f.rating,
        who: f.attribution === "name" && f.attributionName ? `${f.attributionName}, ${ROLE_LABEL[f.role]}` : f.attribution === "role" ? ROLE_LABEL[f.role] : "Participant",
        pilot: f.eventId ? (pilotName.get(f.eventId) ?? null) : null,
        collectedAt: f.collectedAt.getTime(),
      })),
  };
}
