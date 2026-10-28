import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/server/db/client";
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
  const ok = Object.values(checks).every((c) => c.ok);
  return NextResponse.json({ ok, checks }, { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
