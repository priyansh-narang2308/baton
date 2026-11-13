import { computeTraction, DAY_MS, startOfUtcDay, type Range, type TractionInput, type TractionResult } from "./traction";

/**
 * SAMPLE DATA — NOT REAL TRACTION.
 * Synthetic rows for previewing the /traction layout in development. Never read from or written to the database,
 * only reachable when `sampleDataAllowed()` is true, and always rendered under a visible banner.
 */
export function sampleDataAllowed() {
  return process.env.TRACTION_SAMPLE_DATA === "1" && process.env.VERCEL_ENV !== "production";
}

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

export function sampleTraction(range: Range, now = new Date()): TractionResult {
  const r = rng(7);
  const day0 = startOfUtcDay(new Date(now.getTime() - 9 * DAY_MS)).getTime();
  const input: TractionInput = {
    now,
    range,
    pilots: [
      { eventId: "s1", kind: "pilot", publicName: "Sample pilot A", publicContext: "Sample data", startsAt: new Date(day0 + 2 * DAY_MS), endsAt: new Date(day0 + 3 * DAY_MS) },
      { eventId: "s2", kind: "rehearsal", publicName: "Sample rehearsal B", publicContext: "Sample data", startsAt: new Date(day0 + 6 * DAY_MS), endsAt: new Date(day0 + 7 * DAY_MS) },
    ],
    events: [
      { id: "s1", isDemo: false, nexconnGroupId: "gs1", botUserId: "bots1" },
      { id: "s2", isDemo: false, nexconnGroupId: "gs2", botUserId: "bots2" },
    ],
    people: [],
    excludedUserIds: [],
    incidents: [],
    reports: [],
    audit: [],
    messages: [],
    connections: [],
    snapshots: [
      { id: "sm", metric: "mau", value: 61, periodStart: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)), periodEnd: now, consolePath: "Sample data", capturedAt: now },
    ],
    feedback: [
      { id: "f1", eventId: "s1", role: "organizer", quote: "Sample quote. Real feedback appears here only with the participant's permission.", rating: null, attribution: "role", attributionName: null, published: true, collectedAt: now },
    ],
  };
  let n = 0;
  for (const [ev, startDay, crew, att] of [["s1", 2, 14, 30], ["s2", 6, 9, 12]] as const) {
    for (let k = 0; k < crew; k++) input.people.push({ id: `${ev}m${k}`, eventId: ev, nexconnUserId: `c${ev}m${k}`, isSimulated: false, kind: "crew" });
    for (let k = 0; k < att; k++) input.people.push({ id: `${ev}a${k}`, eventId: ev, nexconnUserId: `a${ev}a${k}`, isSimulated: false, kind: "attendee" });
    for (let d = 0; d < 2; d++) {
      const base = day0 + (startDay + d) * DAY_MS + 4 * 3600_000;
      for (let k = 0; k < crew; k++) {
        input.connections.push({ userId: `c${ev}m${k}`, status: "0", time: new Date(base + r() * 3600_000) });
        const msgs = Math.floor(r() * 8);
        for (let j = 0; j < msgs; j++) input.messages.push({ messageId: `m${n++}`, userId: `c${ev}m${k}`, channelId: `g${ev}`, channelType: 3, time: new Date(base + r() * 9 * 3600_000) });
      }
      const incs = d === 0 ? Math.floor(att * 0.5) : Math.floor(att * 0.3);
      for (let k = 0; k < incs; k++) {
        const id = `i${n++}`;
        const created = new Date(base + r() * 8 * 3600_000);
        const claimed = new Date(created.getTime() + (20 + r() * 400) * 1000);
        const resolved = r() < 0.85 ? new Date(claimed.getTime() + (60 + r() * 1500) * 1000) : null;
        const attendee = `${ev}a${k % att}`;
        input.incidents.push({ id, eventId: ev, status: resolved ? "resolved" : "claimed", createdAt: created, claimedAt: claimed, resolvedAt: resolved });
        input.reports.push({ id: `r${n++}`, incidentId: id, attendeeId: attendee, memberId: null, attachedBy: "new", createdAt: created });
        if (r() < 0.3) input.reports.push({ id: `r${n++}`, incidentId: id, attendeeId: null, memberId: `${ev}m${k % crew}`, attachedBy: "auto", createdAt: new Date(created.getTime() + 60_000) });
        input.audit.push({ incidentId: id, actor: `${ev}m${k % crew}`, type: "incident.claimed", at: claimed });
        if (r() < 0.2) {
          input.audit.push({ incidentId: id, actor: `${ev}m${k % crew}`, type: "pass.offered", at: new Date(claimed.getTime() + 30_000) });
          input.audit.push({ incidentId: id, actor: `${ev}m${(k + 1) % crew}`, type: "pass.accepted", at: new Date(claimed.getTime() + 90_000) });
        }
      }
    }
  }
  return computeTraction(input);
}
