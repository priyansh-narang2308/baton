import { randomBytes } from "node:crypto";

const ALPHABET = "abcdefghijkmnopqrstuvwxyz23456789"; // no l/1/0 — readable in URLs and QR fallbacks

/** Random, non-sequential id. Nexconn user/channel ids allow only letters and digits (≤ 64 bytes). */
export function randomId(length = 16): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

export const newId = {
  event: () => `ev${randomId(14)}`,
  zone: () => `zn${randomId(12)}`,
  member: () => `mb${randomId(14)}`,
  attendee: () => `at${randomId(14)}`,
  incident: () => `in${randomId(14)}`,
  report: () => `rp${randomId(14)}`,
  audit: () => `ae${randomId(16)}`,
  suggestion: () => `ms${randomId(14)}`,
  secret: () => randomId(32),
  crewCode: () => randomId(8),
};

/** Nexconn user ids: prefix encodes the role (crew, attendee, bot). */
export const nexconnUserId = {
  crew: (memberId: string) => `c${memberId}`,
  attendee: (attendeeId: string) => `a${attendeeId}`,
  bot: (eventId: string) => `bot${eventId}`,
};
