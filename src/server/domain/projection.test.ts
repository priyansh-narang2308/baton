import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { createDb } from "../db/client";
import { events, incidents, members, zones } from "../db/schema";
import type { NexconnApi } from "../nexconn/api";
import { assignIncident, submitReport } from "./incidents";
import { applyEffects } from "./projection";

const db = createDb(process.env.TEST_DATABASE_URL ?? "postgres://baton@localhost:54329/baton_test");
afterAll(async () => {
  await (db.$client as unknown as { end: () => Promise<void> }).end();
});

beforeEach(async () => {
  await db.execute(sql`truncate events, zones, members, attendees, incidents, reports, merge_suggestions, incident_events, notifications, webhook_events restart identity cascade`);
  await db.insert(events).values({ id: "evproj", slug: "proj", name: "Proj", organizerToken: "o", crewCode: "cp", nexconnGroupId: "gproj", botUserId: "botproj" });
  await db.insert(zones).values({ id: "zg", eventId: "evproj", name: "Gate 3", slug: "gate-3" });
});

/** Records Server API calls; sends are slow, like a real network round trip. */
function fakeApi() {
  const calls: string[] = [];
  let n = 0;
  const api = {
    async sendGroupMessage() {
      calls.push("send");
      await new Promise((r) => setTimeout(r, 40));
      return `MSG-${++n}`;
    },
    async setMessageMetadata() {
      calls.push("metadata");
    },
    async sendDirectMessage() {
      calls.push("dm");
    },
  } as unknown as NexconnApi;
  return { api, calls };
}

describe("applyEffects", () => {
  it("posts one card when a report and its duplicate are projected at the same time", async () => {
    const report = (attendeeId: string) =>
      submitReport(db, { eventId: "evproj", source: "attendee", attendeeId, zoneId: "zg", category: "supplies", text: "water empty", structured: true });
    const a = await report("a1");
    const b = await report("a2");
    expect(b.incidentId).toBe(a.incidentId);
    const { api, calls } = fakeApi();
    // Both projections start before the first send returns (what after() does for two quick requests).
    await Promise.all([applyEffects(db, api, a.effects), applyEffects(db, api, b.effects)]);
    expect(calls.filter((c) => c === "send")).toHaveLength(1);
    const [inc] = await db.select().from(incidents);
    expect(inc.cardMessageId).toBe("MSG-1");
    expect(inc.projectedVersion).toBe(inc.version);
  });

  it("tells only the assignee, and skips the message if the incident moved on", async () => {
    await db.insert(members).values([
      { id: "mblead", eventId: "evproj", role: "lead", name: "Asha", nexconnUserId: "cmblead" },
      { id: "mbvol", eventId: "evproj", role: "volunteer", name: "Riya", nexconnUserId: "cmbvol" },
      { id: "mbvol2", eventId: "evproj", role: "volunteer", name: "Sam", nexconnUserId: "cmbvol2" },
    ]);
    const sent: { toUserIds?: string[]; content: Record<string, unknown> }[] = [];
    const api = {
      async sendGroupMessage(input: { toUserIds?: string[]; content: Record<string, unknown> }) {
        sent.push(input);
        return "MSG-x";
      },
      async setMessageMetadata() {},
      async sendDirectMessage() {},
    } as unknown as NexconnApi;
    const { incidentId } = await submitReport(db, { eventId: "evproj", source: "attendee", attendeeId: "a1", zoneId: "zg", category: "supplies", text: "water", structured: true });
    const r = await assignIncident(db, "evproj", incidentId, "mblead", "mbvol");
    await applyEffects(db, api, r.effects.filter((e) => e.type === "assigned"));
    expect(sent).toEqual([expect.objectContaining({ toUserIds: ["cmbvol"], content: expect.objectContaining({ kind: "assigned", byName: "Asha", number: 1 }) })]);

    // Reassigned before the projection ran: the stale "assigned to Riya" message is not sent.
    const second = await assignIncident(db, "evproj", incidentId, "mblead", "mbvol2");
    sent.length = 0;
    await applyEffects(db, api, r.effects.filter((e) => e.type === "assigned"));
    expect(sent).toHaveLength(0);
    await applyEffects(db, api, second.effects.filter((e) => e.type === "assigned"));
    expect(sent[0].toUserIds).toEqual(["cmbvol2"]);
  });

  it("reports not-configured instead of pretending", async () => {
    const logs: string[] = [];
    expect(await applyEffects(db, null, [{ type: "card.update", incidentId: "x" }], (m) => logs.push(m))).toEqual({ ok: false });
    expect(logs[0]).toMatch(/not configured/);
  });
});
