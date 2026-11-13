import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { env } from "./env";

/**
 * Admin access for recording traction data (Console snapshots, pilot verification, feedback).
 * Disabled entirely unless TRACTION_ADMIN_TOKEN (32+ characters) is set. The cookie is bound to the token, so
 * rotating the token signs every admin out.
 */
const COOKIE = "baton_traction_admin";
const MAX_AGE_S = 12 * 60 * 60;

function token(): string | null {
  const t = process.env.TRACTION_ADMIN_TOKEN;
  return t && t.length >= 32 ? t : null;
}

export const adminEnabled = () => token() !== null;

const digest = (s: string) => createHash("sha256").update(s).digest();

function mac(payload: string) {
  return createHmac("sha256", env().SESSION_SECRET).update(`${payload}|${digest(token() ?? "").toString("hex")}`).digest("base64url");
}

export function tokenMatches(given: string): boolean {
  const t = token();
  if (!t) return false;
  return timingSafeEqual(digest(given), digest(t));
}

export async function startAdminSession() {
  const exp = Date.now() + MAX_AGE_S * 1000;
  const payload = `admin.${exp}`;
  (await cookies()).set(COOKIE, `${payload}.${mac(payload)}`, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/traction/admin",
    maxAge: MAX_AGE_S,
  });
}

export async function endAdminSession() {
  (await cookies()).delete({ name: COOKIE, path: "/traction/admin" });
}

export async function isAdmin(): Promise<boolean> {
  if (!adminEnabled()) return false;
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return false;
  const parts = raw.split(".");
  if (parts.length !== 3 || parts[0] !== "admin") return false;
  const payload = `${parts[0]}.${parts[1]}`;
  const expected = Buffer.from(mac(payload));
  const given = Buffer.from(parts[2]);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return false;
  return Number(parts[1]) > Date.now();
}
