import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/** Signature = sha1(AppSecret + Nonce + Timestamp), lowercase hex (docs: prepare-to-use-api/auth, webhook/overview). */
export function nexconnSignature(appSecret: string, nonce: string, timestamp: string): string {
  return createHash("sha1").update(appSecret + nonce + timestamp).digest("hex");
}

export function signedHeaders(appKey: string, appSecret: string, now = Date.now()) {
  const nonce = randomBytes(8).toString("hex"); // 16 chars; docs allow ≤ 18
  const timestamp = String(now);
  return {
    "App-Key": appKey,
    Nonce: nonce,
    Timestamp: timestamp,
    Signature: nexconnSignature(appSecret, nonce, timestamp),
    "X-Request-ID": randomBytes(16).toString("hex"),
    "Content-Type": "application/json",
  };
}

export type WebhookCheck = { ok: true } | { ok: false; reason: "missing_headers" | "bad_signature" | "stale" | "wrong_app" };

/**
 * Verifies a webhook request. The signature covers only secret+nonce+timestamp — not the body — so we also
 * enforce a freshness window; callers must still dedupe on the envelope id and treat payloads as hints.
 */
export function verifyWebhook(
  headers: { get(name: string): string | null },
  appKey: string,
  appSecret: string,
  now = Date.now(),
  maxSkewMs = 5 * 60_000,
): WebhookCheck {
  const nonce = headers.get("nonce");
  const timestamp = headers.get("timestamp");
  const signature = headers.get("signature");
  const key = headers.get("appkey") ?? headers.get("app-key");
  if (!nonce || !timestamp || !signature) return { ok: false, reason: "missing_headers" };
  if (key && key !== appKey) return { ok: false, reason: "wrong_app" };
  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(now - ts) > maxSkewMs) return { ok: false, reason: "stale" };
  const expected = Buffer.from(nexconnSignature(appSecret, nonce, timestamp), "utf8");
  const given = Buffer.from(signature.toLowerCase(), "utf8");
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return { ok: false, reason: "bad_signature" };
  return { ok: true };
}
