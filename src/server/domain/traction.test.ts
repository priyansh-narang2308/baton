import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { createDb } from "../db/client";
import { attendees, events, incidents, members, reports, tractionConsoleSnapshots, tractionExclusions, tractionPilots } from "../db/schema";
import { computeTraction, resolveRange, type TractionInput } from "./traction";
import { loadTraction } from "./traction-data";
import { recordWebhook, WebhookEnvelope } from "./webhooks";

const NOW = new Date("2026-11-14T12:00:00Z");
const t = (iso: string) => new Date(iso);

/** One verified pilot (ev1), one demo event wrongly "verified" (demo), one unverified real event (ev3). */
function base(): TractionInput {
  return {
    now: NOW,
    range: resolveRange("challenge", NOW),
    pilots: [
      { eventId: "ev1", kind: "pilot", publicName: "College fest", publicContext: "Delhi", startsAt: t("2026-11-10T04:00:00Z"), endsAt: t("2026-11-10T14:00:00Z") },
      { eventId: "demo", kind: "pilot", publicName: "Demo", publicContext: "", startsAt: t("2026-11-10T04:00:00Z"), endsAt: t("2026-11-10T14:00:00Z") },
    ],
    events: [
      { id: "ev1", isDemo: false, nexconnGroupId: "g1", botUserId: "botev1" },
      { id: "demo", isDemo: true, nexconnGroupId: "gd", botUserId: "botdemo" },
      { id: "ev3", isDemo: false, nexconnGroupId: "g3", botUserId: "botev3" },
    ],
    people: [
      { id: "m1", eventId: "ev1", nexconnUserId: "cm1", isSimulated: false, kind: "crew" },
      { id: "m2", eventId: "ev1", nexconnUserId: "cm2", isSimulated: false, kind: "crew" },
      { id: "m3", eventId: "ev1", nexconnUserId: "cm3", isSimulated: false, kind: "crew" }, // the founder's phone: excluded
      { id: "a1", eventId: "ev1", nexconnUserId: "aa1", isSimulated: false, kind: "attendee" },
      { id: "a2", eventId: "ev1", nexconnUserId: "aa2", isSimulated: true, kind: "attendee" },
      { id: "md", eventId: "demo", nexconnUserId: "cmd", isSimulated: false, kind: "crew" },
      { id: "m9", eventId: "ev3", nexconnUserId: "cm9", isSimulated: false, kind: "crew" },
    ],
    excludedUserIds: ["cm3"],
    incidents: [
      { id: "i1", eventId: "ev1", status: "resolved", createdAt: t("2026-11-10T05:00:00Z"), claimedAt: t("2026-11-10T05:00:30Z"), resolvedAt: t("2026-11-10T05:04:00Z") },
      { id: "i2", eventId: "ev1", status: "claimed", createdAt: t("2026-11-10T06:00:00Z"), claimedAt: t("2026-11-10T06:10:00Z"), resolvedAt: null },
      { id: "i3", eventId: "ev1", status: "open", createdAt: t("2026-11-10T07:00:00Z"), claimedAt: null, resolvedAt: null }, // simulated reporter only
      { id: "i4", eventId: "demo", status: "resolved", createdAt: t("2026-11-10T05:00:00Z"), claimedAt: t("2026-11-10T05:00:10Z"), resolvedAt: t("2026-11-10T05:01:00Z") },
      { id: "i5", eventId: "ev3", status: "open", createdAt: t("2026-11-10T05:00:00Z"), claimedAt: null, resolvedAt: null },
    ],
    reports: [
      { id: "r1", incidentId: "i1", attendeeId: "a1", memberId: null, attachedBy: "new", createdAt: t("2026-11-10T05:00:00Z") },
      { id: "r2", incidentId: "i1", attendeeId: null, memberId: "m2", attachedBy: "auto", createdAt: t("2026-11-10T05:01:00Z") },
      { id: "r3", incidentId: "i2", attendeeId: null, memberId: "m1", attachedBy: "new", createdAt: t("2026-11-10T06:00:00Z") },
      { id: "r4", incidentId: "i3", attendeeId: "a2", memberId: null, attachedBy: "new", createdAt: t("2026-11-10T07:00:00Z") },
      { id: "r5", incidentId: "i4", attendeeId: null, memberId: "md", attachedBy: "new", createdAt: t("2026-11-10T05:00:00Z") },
      { id: "r6", incidentId: "i5", attendeeId: null, memberId: "m9", attachedBy: "new", createdAt: t("2026-11-10T05:00:00Z") },
    ],
    audit: [
      { incidentId: "i1", actor: "m1", type: "incident.claimed", at: t("2026-11-10T05:00:30Z") },
      { incidentId: "i1", actor: "m1", type: "pass.offered", at: t("2026-11-10T05:02:00Z") },
      { incidentId: "i1", actor: "m2", type: "pass.accepted", at: t("2026-11-10T05:02:30Z") },
    ],
    messages: [
      { messageId: "x1", userId: "cm1", channelId: "g1", channelType: 3, time: t("2026-11-10T05:00:00Z") },
      { messageId: "x1", userId: "cm1", channelId: "g1", channelType: 3, time: t("2026-11-10T05:00:00Z") }, // redelivered
      { messageId: "x2", userId: "cm2", channelId: "g1", channelType: 3, time: t("2026-11-11T05:00:00Z") },
      { messageId: "x3", userId: "botev1", channelId: "g1", channelType: 3, os: "Server", time: t("2026-11-10T05:00:01Z") },
      { messageId: "x4", userId: "cm3", channelId: "g1", channelType: 3, time: t("2026-11-10T05:00:00Z") }, // excluded sender
      { messageId: "x5", userId: "cmd", channelId: "gd", channelType: 3, time: t("2026-11-10T05:00:00Z") }, // demo
      { messageId: "x6", userId: "cm9", channelId: "g3", channelType: 3, time: t("2026-11-10T05:00:00Z") }, // unverified
      { messageId: "x7", userId: "cm1", channelId: "cm2", channelType: 1, time: t("2026-11-10T05:03:00Z") }, // direct
    ],
    connections: [{ userId: "aa1", status: "0", time: t("2026-11-10T04:59:00Z") }],
    snapshots: [],
    feedback: [],
  };
}

describe("computeTraction", () => {
  it("counts only verified, non-demo pilots and real, non-excluded people", () => {
    const r = computeTraction(base());
    expect(r.headline.pilotEvents).toBe(1);
    expect(r.headline.activeParticipants).toBe(3); // m1, m2, a1 — not the excluded, simulated, demo or unverified ones
    expect(r.headline.crew).toBe(2);
    expect(r.headline.attendees).toBe(1);
    expect(r.headline.incidentsReported).toBe(2); // i3 has only a simulated reporter
    expect(r.headline.incidentsResolved).toBe(1);
  });

  it("counts each message once and keeps server messages separate", () => {
    const r = computeTraction(base());
    expect(r.headline.userMessages).toBe(3); // x1 (once), x2, x7
    expect(r.headline.systemMessages).toBe(1); // x3
  });

  it("computes impact and timings from the records", () => {
    const r = computeTraction(base());
    expect(r.impact).toMatchObject({ requests: 3, incidents: 2, claimed: 2, resolved: 1, duplicatesConsolidated: 1, handoversOffered: 1, handoversAccepted: 1 });
    expect(r.impact.timeToClaim).toEqual({ medianSec: 30, p90Sec: 600, samples: 2 });
    expect(r.impact.timeToResolve).toEqual({ medianSec: 240, p90Sec: 240, samples: 1 });
    expect(r.responseBuckets.find((b) => b.label === "Under 1 min")?.claim).toBe(1);
    expect(r.responseBuckets.find((b) => b.label === "5–15 min")?.claim).toBe(1);
  });

  it("builds a daily series from the first day with data", () => {
    const r = computeTraction(base());
    expect(new Date(r.daily[0].day).toISOString()).toBe("2026-11-10T00:00:00.000Z");
    expect(r.daily[0]).toMatchObject({ active: 3, messages: 2, reported: 2, resolved: 1, passes: 1 });
    expect(r.daily[1]).toMatchObject({ active: 1, messages: 1 });
  });

  it("shows nothing, not zeros dressed as data, when no pilot is verified", () => {
    const r = computeTraction({ ...base(), pilots: [] });
    expect(r.headline.activeParticipants).toBe(0);
    expect(r.daily).toEqual([]);
    expect(r.pilots).toEqual([]);
    expect(r.dataThrough).toBeNull();
  });

  it("only reports a trend when the previous window had data", () => {
    const r = computeTraction({ ...base(), range: resolveRange("7d", NOW) });
    expect(r.headline.activeParticipantsDelta).toBeNull();
  });

  it("uses the latest Console MAU snapshot as is", () => {
    const snap = (id: string, value: number, captured: string) => ({ id, metric: "mau" as const, value, periodStart: t("2026-11-01T00:00:00Z"), periodEnd: t("2026-11-30T23:59:59Z"), consolePath: "Console", capturedAt: t(captured) });
    const r = computeTraction({ ...base(), snapshots: [snap("s1", 4, "2026-11-11T00:00:00Z"), snap("s2", 7, "2026-11-13T00:00:00Z")] });
    expect(r.console.mau?.value).toBe(7);
  });

  it("publishes only feedback marked published, with the agreed attribution", () => {
    const fb = (id: string, published: boolean, attribution: "anonymous" | "role" | "name") => ({ id, eventId: "ev1", role: "organizer" as const, quote: "q", rating: 5, attribution, attributionName: "Asha", published, collectedAt: t("2026-11-11T00:00:00Z") });
    const r = computeTraction({ ...base(), feedback: [fb("f1", true, "role"), fb("f2", false, "name"), fb("f3", true, "anonymous")] });
    expect(r.feedback.map((f) => f.who).sort()).toEqual(["Organizer", "Participant"]);
  });
});

// ── The database path: webhook redeliveries must not inflate counts. ──────────────────────────────────────────────

const db = createDb(process.env.TEST_DATABASE_URL ?? "postgres://baton@localhost:54329/baton_test");

describe("loadTraction", () => {
  beforeEach(async () => {
    await db.execute(sql`truncate webhook_events, traction_feedback, traction_console_snapshots, traction_exclusions, traction_pilots, reports, incidents, attendees, members, zones, events cascade`);
  });
  afterAll(async () => {
    await (db.$client as unknown as { end: () => Promise<void> }).end();
  });

  it("counts a message once across duplicate webhook deliveries and different envelopes", async () => {
    await db.insert(events).values({ id: "evp", slug: "evp", name: "Pilot", organizerToken: "o", crewCode: "cc", nexconnGroupId: "gp", botUserId: "botevp" });
    await db.insert(members).values([
      { id: "mp1", eventId: "evp", role: "lead", name: "Lead", nexconnUserId: "cmp1" },
      { id: "mp2", eventId: "evp", role: "volunteer", name: "Me", nexconnUserId: "cmp2" },
    ]);
    await db.insert(attendees).values({ id: "ap1", eventId: "evp", nexconnUserId: "aap1" });
    await db.insert(incidents).values({ id: "ip1", eventId: "evp", number: 1, category: "supplies", title: "Water", status: "resolved", createdAt: t("2026-11-12T05:00:00Z"), claimedAt: t("2026-11-12T05:01:00Z"), resolvedAt: t("2026-11-12T05:05:00Z") });
    await db.insert(reports).values({ id: "rp1", eventId: "evp", incidentId: "ip1", source: "attendee", attendeeId: "ap1", category: "supplies", structured: true, createdAt: t("2026-11-12T05:00:00Z") });
    await db.insert(tractionPilots).values({ eventId: "evp", kind: "pilot", publicName: "Pilot", startsAt: t("2026-11-12T00:00:00Z"), endsAt: t("2026-11-12T20:00:00Z"), verificationNote: "test" });
    await db.insert(tractionExclusions).values({ nexconnUserId: "cmp2", reason: "team" });
    await db.insert(tractionConsoleSnapshots).values({ id: "s1", metric: "mau", value: 3, periodStart: t("2026-11-01T00:00:00Z"), periodEnd: t("2026-11-30T00:00:00Z"), consolePath: "Console", capturedAt: t("2026-11-13T00:00:00Z") });

    const item = { messageId: "msgA", userId: "cmp1", channelId: "gp", channelType: 3, messageType: "RC:TxtMsg", content: "private text", time: t("2026-11-12T05:02:00Z").getTime() };
    const env = (id: string, data: unknown[]) => WebhookEnvelope.parse({ type: "message:send", id, time: item.time, data });
    await recordWebhook(db, env("e1", [item]));
    await recordWebhook(db, env("e1", [item])); // same envelope redelivered
    await recordWebhook(db, env("e2", [item])); // same message in a second envelope
    await recordWebhook(db, env("e3", [{ ...item, messageId: "msgB", userId: "cmp2" }])); // excluded sender

    const r = await loadTraction(db, resolveRange("challenge", NOW), NOW);
    expect(r.headline.userMessages).toBe(1);
    expect(r.headline.activeParticipants).toBe(2); // the lead and the attendee
    expect(r.impact.timeToClaim.medianSec).toBe(60);
    expect(r.console.mau?.value).toBe(3);
    expect(JSON.stringify(r)).not.toContain("private text");
    expect(JSON.stringify(r)).not.toContain("cmp1");
  });
});
