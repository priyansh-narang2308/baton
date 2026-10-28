import { afterAll, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { createDb } from "../db/client";
import { attendees, events, members, zones } from "../db/schema";
import { computeImpact, eventImpact, percentile, type ImpactIncident, type ImpactReport } from "./impact";
import { claimIncident, resolveIncident, submitReport } from "./incidents";

const T0 = new Date("2026-11-08T10:00:00Z");
const at = (min: number) => new Date(T0.getTime() + min * 60_000);

function inc(id: string, over: Partial<ImpactIncident> = {}): ImpactIncident {
  return { id, zoneId: "z1", category: "supplies", priority: "normal", origin: "report", status: "open", ownerMemberId: null, escalationLevel: 0, createdAt: at(0), claimedAt: null, resolvedAt: null, ...over };
}
function rep(incidentId: string, over: Partial<ImpactReport> = {}): ImpactReport {
  return { incidentId, source: "attendee", attendeeId: `a-${Math.random()}`, memberId: null, simulated: false, createdAt: at(0), ...over };
}

describe("percentile", () => {
  it("uses nearest-rank", () => {
    expect(percentile([], 50)).toBeNull();
    expect(percentile([5], 90)).toBe(5);
    expect(percentile([1, 2, 3, 4], 50)).toBe(2);
    expect(percentile([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 90)).toBe(9);
  });
});

describe("computeImpact", () => {
  const base = {
    zones: [{ id: "z1", name: "Gate 3" }, { id: "z2", name: "Hall B" }],
    crew: [{ id: "m1", name: "Riya", isSimulated: false }, { id: "m2", name: "Sim Sam", isSimulated: true }],
    notifiedAttendees: 3,
    now: at(60),
  };

  it("counts duplicates absorbed, timings, zones and the closed loop", () => {
    const r = computeImpact({
      ...base,
      incidents: [
        inc("i1", { status: "resolved", ownerMemberId: "m1", claimedAt: at(1), resolvedAt: at(11) }),
        inc("i2", { zoneId: "z2", category: "tech", status: "claimed", ownerMemberId: "m1", claimedAt: at(3), origin: "chat" }),
        inc("i3", { zoneId: "z2", createdAt: at(20), escalationLevel: 1 }),
        inc("i4", { status: "withdrawn" }), // merged away: ignored
      ],
      reports: [rep("i1", { attendeeId: "a1" }), rep("i1", { attendeeId: "a2" }), rep("i1", { attendeeId: "a3" }), rep("i2", { source: "crew", attendeeId: null, memberId: "m1" }), rep("i3", { attendeeId: "a1" })],
    });
    expect(r.totals).toMatchObject({ reports: 5, incidents: 3, duplicatesAbsorbed: 2, open: 1, claimed: 1, resolved: 1, fromChat: 1, escalated: 1, attendeeReporters: 3, attendeesNotified: 3, attendeesClosedLoop: 3 });
    expect(r.timeToClaim).toEqual({ medianSec: 60, p90Sec: 180, samples: 2 });
    expect(r.timeToFix).toEqual({ medianSec: 660, p90Sec: 660, samples: 1 });
    expect(r.oldestOpenSec).toBe(40 * 60);
    expect(r.byZone.map((z) => [z.name, z.incidents, z.reports, z.open])).toEqual([
      ["Gate 3", 1, 3, 0],
      ["Hall B", 2, 2, 1],
    ]);
    expect(r.byCategory[0]).toEqual({ category: "supplies", incidents: 2, reports: 4 });
    expect(r.responders).toEqual([{ memberId: "m1", name: "Riya", simulated: false, claimed: 2, resolved: 1 }]);
    expect(r.timeline.reduce((n, b) => n + b.reports, 0)).toBe(5);
    expect(r.timeline.reduce((n, b) => n + b.resolved, 0)).toBe(1);
    expect(r.simulated).toEqual({ reports: 0, share: 0 });
  });

  it("keeps simulated activity out of the real numbers", () => {
    const r = computeImpact({
      ...base,
      incidents: [inc("i1"), inc("i2", { zoneId: "z2" })],
      reports: [rep("i1"), rep("i2", { simulated: true }), rep("i2", { simulated: true })],
    });
    expect(r.totals).toMatchObject({ reports: 1, incidents: 1 });
    expect(r.simulated).toEqual({ reports: 2, share: 2 / 3 });
  });

  it("is empty-safe", () => {
    const r = computeImpact({ ...base, incidents: [], reports: [] });
    expect(r.totals.reports).toBe(0);
    expect(r.timeToClaim.medianSec).toBeNull();
    expect(r.timeline).toEqual([]);
    expect(r.oldestOpenSec).toBeNull();
  });
});

describe("eventImpact (real Postgres)", () => {
  const db = createDb(process.env.TEST_DATABASE_URL ?? "postgres://baton@localhost:54329/baton_test");
  afterAll(async () => {
    await (db.$client as unknown as { end: () => Promise<void> }).end();
  });

  it("reports a real event end to end", async () => {
    await db.execute(sql`truncate events, zones, members, attendees, incidents, reports, merge_suggestions, incident_events, notifications, webhook_events restart identity cascade`);
    await db.insert(events).values({ id: "evimp", slug: "imp", name: "Impact Fest", organizerToken: "o", crewCode: "ci", nexconnGroupId: "gi", botUserId: "boti" });
    await db.insert(zones).values({ id: "zg", eventId: "evimp", name: "Gate 3", slug: "gate-3" });
    await db.insert(members).values({ id: "mr", eventId: "evimp", role: "volunteer", name: "Riya", nexconnUserId: "cmr" });
    await db.insert(attendees).values([
      { id: "a1", eventId: "evimp", nexconnUserId: "aa1" },
      { id: "a2", eventId: "evimp", nexconnUserId: "aa2" },
      { id: "as", eventId: "evimp", nexconnUserId: "aas", isSimulated: true },
    ]);
    const r1 = await submitReport(db, { eventId: "evimp", source: "attendee", attendeeId: "a1", zoneId: "zg", category: "supplies", text: "water empty", structured: true, now: at(0) });
    await submitReport(db, { eventId: "evimp", source: "attendee", attendeeId: "a2", zoneId: "zg", category: "supplies", text: "", structured: true, now: at(1) });
    await submitReport(db, { eventId: "evimp", source: "attendee", attendeeId: "as", zoneId: null, category: "tech", text: "sim", structured: false, now: at(2) });
    await claimIncident(db, "evimp", r1.incidentId, "mr", at(2));
    await resolveIncident(db, "evimp", r1.incidentId, "mr", at(9));

    const out = await eventImpact(db, "evimp", at(30));
    expect(out?.impact.totals).toMatchObject({ reports: 2, incidents: 1, duplicatesAbsorbed: 1, resolved: 1, attendeeReporters: 2, attendeesClosedLoop: 2 });
    expect(out?.impact.timeToClaim.medianSec).toBe(120);
    expect(out?.impact.timeToFix.medianSec).toBe(540);
    expect(out?.impact.simulated.reports).toBe(1);
    expect(await eventImpact(db, "nope")).toBeNull();
  });
});
