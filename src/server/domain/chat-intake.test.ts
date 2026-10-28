import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { eq, sql } from "drizzle-orm";
import { createDb } from "../db/client";
import { events, incidentEvents, incidents, members, zones } from "../db/schema";
import { handleMessageSend, requestFromChat } from "./chat-intake";
import { claimIncident, dismissDetection, listIncidents, submitReport } from "./incidents";

const db = createDb(process.env.TEST_DATABASE_URL ?? "postgres://baton@localhost:54329/baton_test");
const EVENT = "evchat";
const GROUP = "gevchat";
const HALLB = "znhallb";

beforeEach(async () => {
  await db.execute(sql`truncate events, zones, members, attendees, incidents, reports, merge_suggestions, incident_events, notifications, webhook_events restart identity cascade`);
  await db.insert(events).values({ id: EVENT, slug: "chatfest", name: "Chat Fest", organizerToken: "org", crewCode: "crewc", nexconnGroupId: GROUP, botUserId: "botevchat" });
  await db.insert(zones).values([
    { id: HALLB, eventId: EVENT, name: "Hall B", slug: "hall-b" },
    { id: "zngate3", eventId: EVENT, name: "Gate 3", slug: "gate-3" },
  ]);
  await db.insert(members).values([
    { id: "mbriya", eventId: EVENT, role: "volunteer", name: "Riya", nexconnUserId: "cmbriya" },
    { id: "mbsam", eventId: EVENT, role: "volunteer", name: "Sam", nexconnUserId: "cmbsam" },
    { id: "mblead", eventId: EVENT, role: "lead", name: "Asha", nexconnUserId: "cmblead" },
  ]);
});
afterAll(async () => {
  await (db.$client as unknown as { end: () => Promise<void> }).end();
});

const item = (over: Record<string, unknown> = {}, text = "need 2 more chairs at Hall B") => ({
  userId: "cmbriya",
  channelId: GROUP,
  messageType: "RC:TxtMsg",
  content: JSON.stringify({ content: text, extra: "" }),
  channelType: 3,
  time: Date.now(),
  messageId: "MSG-1",
  os: "Websocket",
  ...over,
});

describe("message:send → request in place", () => {
  it("turns crew chat into an incident projected onto the same message", async () => {
    const r = await handleMessageSend(db, item());
    expect(r).toMatchObject({ kind: "request", outcome: "new" });
    const [inc] = await db.select().from(incidents);
    expect(inc).toMatchObject({ origin: "chat", sourceMessageId: "MSG-1", cardMessageId: "MSG-1", zoneId: HALLB, category: "supplies", status: "open" });
    const [created] = await db.select().from(incidentEvents).where(eq(incidentEvents.type, "incident.created"));
    expect(created.payload).toMatchObject({ origin: "chat", mode: "auto", reasons: ["chairs", "Hall B", "“need”"] });
  });

  it("is idempotent across webhook redeliveries", async () => {
    await handleMessageSend(db, item());
    const again = await handleMessageSend(db, item());
    expect(again).toMatchObject({ kind: "request", outcome: "existing", effects: [] });
    expect(await db.select().from(incidents)).toHaveLength(1);
  });

  it.each([
    ["chatter", item({}, "on it 👍"), "not_a_request"],
    ["non-crew sender", item({ userId: "aatt1" }), "not_crew"],
    ["another app's group", item({ channelId: "gother" }), "not_crew"],
    ["server-sent message", item({ os: "Server" }), "server_or_targeted"],
    ["targeted message", item({ groupUserIds: ["cmbsam"] }), "server_or_targeted"],
    ["direct channel", item({ channelType: 1 }), "not_group_text"],
    ["image message", item({ messageType: "RC:ImgMsg" }), "not_group_text"],
    ["bad content", item({ content: "{not json" }), "malformed_content"],
    ["missing fields", { userId: "x" }, "malformed"],
  ])("ignores %s", async (_name, data, reason) => {
    expect(await handleMessageSend(db, data as Record<string, unknown>)).toEqual({ kind: "ignored", reason });
    expect(await db.select().from(incidents)).toHaveLength(0);
  });

  it("ignores messages from removed crew and ended events", async () => {
    await db.update(members).set({ removedAt: new Date() }).where(eq(members.id, "mbriya"));
    expect(await handleMessageSend(db, item())).toEqual({ kind: "ignored", reason: "not_crew" });
    await db.update(members).set({ removedAt: null }).where(eq(members.id, "mbriya"));
    await db.update(events).set({ status: "ended" });
    expect(await handleMessageSend(db, item())).toEqual({ kind: "ignored", reason: "event_ended" });
  });

  it("webhook and a manual tap racing on one message create exactly one incident", async () => {
    const [a, b] = await Promise.all([
      handleMessageSend(db, item()),
      requestFromChat(db, { eventId: EVENT, messageId: "MSG-1", text: "need 2 more chairs at Hall B", senderMemberId: "mbriya", actorMemberId: "mbsam", mode: "manual" }),
    ]);
    expect([a, b].map((r) => (r.kind === "request" ? r.outcome : r.kind)).sort()).toEqual(["existing", "new"]);
    expect(await db.select().from(incidents)).toHaveLength(1);
  });

  it("manual mode keeps text the detector would skip, as category other", async () => {
    const r = await requestFromChat(db, { eventId: EVENT, messageId: "MSG-9", text: "can you look after the VIP guest at the side door", senderMemberId: "mbsam", mode: "manual" });
    expect(r.kind).toBe("request");
    const [inc] = await db.select().from(incidents);
    expect(inc.category).toBe("other");
  });

  it("a chat request about an attendee-reported issue is suggested as a duplicate, never auto-merged", async () => {
    await submitReport(db, { eventId: EVENT, source: "attendee", attendeeId: "at1", zoneId: HALLB, category: "supplies", text: "no chairs", structured: true });
    const r = await handleMessageSend(db, item());
    expect(r).toMatchObject({ kind: "request", outcome: "new_with_suggestion" });
    const list = await listIncidents(db, EVENT);
    expect(list.find((i) => i.origin === "chat")?.suggestion?.candidateNumber).toBe(1);
  });
});

describe("dismissDetection", () => {
  async function detected() {
    const r = await handleMessageSend(db, item());
    if (r.kind !== "request") throw new Error("expected a request");
    return r.incidentId;
  }

  it("lets the sender undo a false detection", async () => {
    const id = await detected();
    const r = await dismissDetection(db, EVENT, id, "mbriya");
    expect(r.effects).toEqual([{ type: "card.update", incidentId: id }]);
    const [inc] = await db.select().from(incidents);
    expect(inc).toMatchObject({ status: "withdrawn", nextEscalationAt: null });
  });

  it("allows leads, forbids other volunteers", async () => {
    const id = await detected();
    await expect(dismissDetection(db, EVENT, id, "mbsam")).rejects.toMatchObject({ code: "forbidden" });
    await expect(dismissDetection(db, EVENT, id, "mblead")).resolves.toBeTruthy();
  });

  it("refuses once someone owns it, and for regular reports", async () => {
    const id = await detected();
    await claimIncident(db, EVENT, id, "mbsam");
    await expect(dismissDetection(db, EVENT, id, "mbriya")).rejects.toMatchObject({ code: "conflict" });
    const rep = await submitReport(db, { eventId: EVENT, source: "crew", memberId: "mbriya", zoneId: null, category: "tech", text: "mic", structured: false });
    await expect(dismissDetection(db, EVENT, rep.incidentId, "mbriya")).rejects.toMatchObject({ code: "invalid" });
  });
});
