import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { env } from "./env";

export type Role = "organizer" | "member" | "attendee";
export type Session = { role: Role; id: string; eventId: string; iat: number };

// One cookie per (role, event) so a single browser can hold the organizer, crew and attendee views of the
// same event at once — the live demo opens all three side by side.
const cookieName = (role: Role, eventId: string) => `baton_${role[0]}_${eventId}`;
const MAX_AGE = 60 * 60 * 24 * 30;

function sign(payload: string) {
  return createHmac("sha256", env().SESSION_SECRET).update(payload).digest("base64url");
}

export function encodeSession(s: Session): string {
  const payload = Buffer.from(JSON.stringify(s)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function decodeSession(raw: string | undefined): Session | null {
  if (!raw) return null;
  const [payload, mac] = raw.split(".");
  if (!payload || !mac) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(mac);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const s = JSON.parse(Buffer.from(payload, "base64url").toString()) as Session;
    return s && typeof s.id === "string" && typeof s.eventId === "string" ? s : null;
  } catch {
    return null;
  }
}

export async function setSession(s: Omit<Session, "iat">) {
  const jar = await cookies();
  jar.set(cookieName(s.role, s.eventId), encodeSession({ ...s, iat: Date.now() }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function getSession(role: Role, eventId: string): Promise<Session | null> {
  const jar = await cookies();
  const s = decodeSession(jar.get(cookieName(role, eventId))?.value);
  return s && s.role === role && s.eventId === eventId ? s : null;
}

export async function clearSession(role: Role, eventId: string) {
  (await cookies()).delete(cookieName(role, eventId));
}
