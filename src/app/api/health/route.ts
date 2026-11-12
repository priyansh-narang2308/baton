import { NextResponse } from "next/server";
import { desc, sql } from "drizzle-orm";
import { db } from "@/server/db/client";
import { webhookEvents } from "@/server/db/schema";
import { env, nexconnConfig } from "@/server/env";

/** Configuration and dependency check — reports what is missing instead of failing silently. */
export async function GET() {
  const checks: Record<string, { ok: boolean; detail?: string }> = {};
  try {
    env();
    checks.config = { ok: true };
  } catch (e) {
    checks.config = { ok: false, detail: (e as Error).message };
  }
  try {
    await db().execute(sql`select 1`);
    checks.database = { ok: true };
  } catch (e) {
    checks.database = { ok: false, detail: (e as Error).message };
  }
  let cfg = null;
  try {
    cfg = nexconnConfig();
  } catch {}
  checks.nexconn = cfg ? { ok: true, detail: `data center ${cfg.dataCenter}` } : { ok: false, detail: "NEXCONN_APP_KEY / NEXCONN_APP_SECRET not set" };
  // Not a pass/fail check (webhooks are optional): shows whether Nexconn is calling us, to confirm the Console setup.
  let webhooks: { lastType: string; lastAt: string } | null = null;
  try {
    const [last] = await db().select({ type: webhookEvents.type, at: webhookEvents.receivedAt }).from(webhookEvents).orderBy(desc(webhookEvents.receivedAt)).limit(1);
    if (last) webhooks = { lastType: last.type, lastAt: last.at.toISOString() };
  } catch {}
  const ok = Object.values(checks).every((c) => c.ok);
  return NextResponse.json({ ok, checks, webhooks }, { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
