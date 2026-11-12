import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { createDb } from "../db/client";
import { applyConnectionStatus, presenceFor } from "./presence";

const db = createDb(process.env.TEST_DATABASE_URL ?? "postgres://baton@localhost:54329/baton_test");
const T = 1_800_000_000_000;

beforeEach(async () => {
  await db.execute(sql`truncate presence_sessions`);
});
afterAll(async () => {
  await db.$client.end();
});

describe("presence from user:connection_status", () => {
  it("is untracked until the first event, so the UI never claims everyone is offline", async () => {
    expect(await presenceFor(db, ["u1"], T)).toEqual({ tracked: false, online: new Set() });
    await applyConnectionStatus(db, { status: "0", userId: "u1", time: T, sessionId: "a" });
    const p = await presenceFor(db, ["u1", "u2"], T);
    expect(p.tracked).toBe(true);
    expect([...p.online]).toEqual(["u1"]);
  });

  it("stays online while any device session is connected", async () => {
    await applyConnectionStatus(db, { status: "0", userId: "u1", time: T, sessionId: "phone" });
    await applyConnectionStatus(db, { status: "0", userId: "u1", time: T + 1, sessionId: "laptop" });
    await applyConnectionStatus(db, { status: "1", userId: "u1", time: T + 2, sessionId: "laptop" });
    expect((await presenceFor(db, ["u1"], T + 3)).online.has("u1")).toBe(true);
    await applyConnectionStatus(db, { status: "2", userId: "u1", time: T + 4, sessionId: "phone" });
    expect((await presenceFor(db, ["u1"], T + 5)).online.has("u1")).toBe(false);
  });

  it("ignores a late, older event (webhooks can arrive out of order)", async () => {
    await applyConnectionStatus(db, { status: "1", userId: "u1", time: T + 10, sessionId: "a" });
    await applyConnectionStatus(db, { status: "0", userId: "u1", time: T, sessionId: "a" });
    expect((await presenceFor(db, ["u1"], T + 11)).online.has("u1")).toBe(false);
  });

  it("treats a session with no news for 12 hours as stale", async () => {
    await applyConnectionStatus(db, { status: "0", userId: "u1", time: T, sessionId: "a" });
    expect((await presenceFor(db, ["u1"], T + 13 * 3600_000)).online.has("u1")).toBe(false);
  });

  it("rejects malformed items", async () => {
    expect(await applyConnectionStatus(db, { userId: "u1" })).toBe(false);
  });
});
