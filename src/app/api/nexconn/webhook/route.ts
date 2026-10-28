import { NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { recordWebhook, WebhookEnvelope } from "@/server/domain/webhooks";
import { nexconnConfig } from "@/server/env";
import { fail } from "@/server/http";
import { verifyWebhook } from "@/server/nexconn/sign";

/**
 * Nexconn webhook endpoint (Console → Chat → Chat settings → Webhooks).
 * Answers fast (< 5 s timeout, 3 attempts), verifies signature + freshness, dedupes on the envelope id.
 */
export async function POST(req: Request) {
  const cfg = nexconnConfig();
  if (!cfg) return fail(503, "nexconn_not_configured", "Messaging is not configured");
  const check = verifyWebhook(req.headers, cfg.appKey, cfg.appSecret);
  if (!check.ok) {
    console.warn("Rejected webhook", check.reason);
    return fail(401, "invalid_signature", check.reason);
  }
  const parsed = WebhookEnvelope.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return fail(400, "invalid", "Malformed webhook envelope");
  try {
    const fresh = await recordWebhook(db(), parsed.data);
    // MVP: webhook events are recorded for audit/validation; crew free-text → incident detection hooks in here later.
    return NextResponse.json({ ok: true, duplicate: !fresh });
  } catch (err) {
    console.error("Webhook processing failed", err);
    return fail(500, "internal", "Webhook processing failed"); // non-2xx → Nexconn retries
  }
}
