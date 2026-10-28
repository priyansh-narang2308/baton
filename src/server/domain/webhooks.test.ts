import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { createDb } from "../db/client";
import { webhookEvents } from "../db/schema";
import { recordWebhook, WebhookEnvelope } from "./webhooks";

const db = createDb(process.env.TEST_DATABASE_URL ?? "postgres://baton@localhost:54329/baton_test");
const envelope = WebhookEnvelope.parse({ type: "message:send", id: "550e8400-e29b-41d4-a716-446655440007", time: 1730192400000, data: [{ messageId: "m1" }] });

beforeEach(async () => {
  await db.execute(sql`truncate webhook_events`);
});
afterAll(async () => {
  await (db.$client as unknown as { end: () => Promise<void> }).end();
});

describe("recordWebhook", () => {
  it("processes an event id once and counts redeliveries", async () => {
    expect(await recordWebhook(db, envelope)).toBe(true);
    expect(await recordWebhook(db, envelope)).toBe(false);
    expect(await recordWebhook(db, envelope)).toBe(false);
    const [row] = await db.select().from(webhookEvents);
    expect(row.deliveries).toBe(3);
  });

  it("is safe under concurrent duplicate deliveries", async () => {
    const results = await Promise.all([1, 2, 3, 4].map(() => recordWebhook(db, envelope)));
    expect(results.filter(Boolean)).toHaveLength(1);
  });
});
