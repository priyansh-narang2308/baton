import { after, NextResponse } from "next/server";
import { db } from "@/server/db/client";
import { handleMessageSend } from "@/server/domain/chat-intake";
import type { Effect } from "@/server/domain/incidents";
import { applyEffects } from "@/server/domain/projection";
import { recordWebhook, WebhookEnvelope } from "@/server/domain/webhooks";
import { nexconnConfig } from "@/server/env";
import { fail } from "@/server/http";
import { verifyWebhook } from "@/server/nexconn/sign";
import { nexconnApi } from "@/server/services";

/**
 * Nexconn webhook endpoint (Console → Chat → Chat settings → Webhooks).
 * Answers fast (< 5 s timeout, 3 attempts), verifies signature + freshness, dedupes on the envelope id.
 * `message:send` from crew → request detection; Nexconn projection runs after the response is sent.
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
    const effects: Effect[] = [];
    let detected = 0;
    if (parsed.data.type === "message:send") {
      // Processed even on redelivery: if an earlier attempt failed midway, the retry finishes it.
      // Idempotent because each chat message maps to at most one incident (unique source_message_id).
      for (const item of parsed.data.data) {
        const r = await handleMessageSend(db(), item);
        if (r.kind === "request") {
          effects.push(...r.effects);
          if (r.outcome !== "existing") detected++;
        }
      }
    }
    if (effects.length) after(() => applyEffects(db(), nexconnApi(), effects));
    return NextResponse.json({ ok: true, duplicate: !fresh, detected });
  } catch (err) {
    console.error("Webhook processing failed", err);
    return fail(500, "internal", "Webhook processing failed"); // non-2xx → Nexconn retries
  }
}
