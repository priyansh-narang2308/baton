import { describe, expect, it } from "vitest";
import { nexconnSignature, signedHeaders, verifyWebhook } from "./sign";

const headers = (h: Record<string, string>) => ({ get: (n: string) => h[n.toLowerCase()] ?? null });

describe("nexconnSignature", () => {
  it("is sha1(secret + nonce + timestamp) in lowercase hex", () => {
    // sha1("secret" + "14314" + "1408710653000"), computed independently with `shasum`
    expect(nexconnSignature("secret", "14314", "1408710653000")).toBe("f7eaab94a01d60cf98173ff82c2f390b7b92c713");
  });

  it("produces headers with a nonce of at most 18 characters", () => {
    const h = signedHeaders("key", "secret", 1_700_000_000_000);
    expect(h["App-Key"]).toBe("key");
    expect(h.Nonce.length).toBeLessThanOrEqual(18);
    expect(h.Signature).toBe(nexconnSignature("secret", h.Nonce, h.Timestamp));
  });
});

describe("verifyWebhook", () => {
  const now = 1_730_192_400_000;
  const good = { appkey: "key", nonce: "8f3a2b1c", timestamp: String(now), signature: nexconnSignature("secret", "8f3a2b1c", String(now)) };

  it("accepts a correctly signed, fresh request", () => {
    expect(verifyWebhook(headers(good), "key", "secret", now)).toEqual({ ok: true });
  });
  it("rejects a bad signature", () => {
    expect(verifyWebhook(headers({ ...good, signature: "0".repeat(40) }), "key", "secret", now)).toEqual({ ok: false, reason: "bad_signature" });
  });
  it("rejects stale timestamps (replay window)", () => {
    expect(verifyWebhook(headers(good), "key", "secret", now + 6 * 60_000)).toEqual({ ok: false, reason: "stale" });
  });
  it("rejects another app's key and missing headers", () => {
    expect(verifyWebhook(headers({ ...good, appkey: "other" }), "key", "secret", now)).toEqual({ ok: false, reason: "wrong_app" });
    expect(verifyWebhook(headers({}), "key", "secret", now)).toEqual({ ok: false, reason: "missing_headers" });
  });
});
