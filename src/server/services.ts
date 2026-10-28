import { and, eq, isNull } from "drizzle-orm";
import { db } from "./db/client";
import { attendees, events, members, nexconnTokens, zones } from "./db/schema";
import { DomainError } from "./domain/incidents";
import { nexconnConfig } from "./env";
import { newId, nexconnUserId } from "./ids";
import { NexconnApi } from "./nexconn/api";

let apiSingleton: NexconnApi | null | undefined;

/** The Server API client, or null when Nexconn credentials are not configured. */
export function nexconnApi(): NexconnApi | null {
  if (apiSingleton === undefined) {
    const cfg = nexconnConfig();
    apiSingleton = cfg ? new NexconnApi(cfg) : null;
  }
  return apiSingleton;
}

export function requireNexconn(): NexconnApi {
  const api = nexconnApi();
  if (!api) throw new DomainError("invalid", "Nexconn is not configured on this server (NEXCONN_APP_KEY / NEXCONN_APP_SECRET missing)");
  return api;
}

/** Returns a cached access token, issuing one through the Server API on first use. */
export async function accessToken(nexconnUser: string, displayName: string, opts: { refresh?: boolean } = {}) {
  if (!opts.refresh) {
    const [cached] = await db().select().from(nexconnTokens).where(eq(nexconnTokens.nexconnUserId, nexconnUser));
    if (cached) return cached.token;
  }
  const { accessToken: token } = await requireNexconn().issueToken(nexconnUser, displayName.slice(0, 64) || "Baton user");
  await db()
    .insert(nexconnTokens)
    .values({ nexconnUserId: nexconnUser, token })
    .onConflictDoUpdate({ target: nexconnTokens.nexconnUserId, set: { token, issuedAt: new Date() } });
  return token;
}

export function slugify(input: string) {
  return (
    input
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "event"
  );
}

export async function createEvent(input: { name: string; zones: string[]; isDemo?: boolean }) {
  const api = requireNexconn();
  const id = newId.event();
  const botUserId = nexconnUserId.bot(id);
  const groupId = `g${id}`;
  // Nexconn first: if it fails, nothing is written and the organizer sees the error.
  await accessToken(botUserId, "Baton");
  await api.createGroup(groupId, input.name.slice(0, 64), botUserId);

  const slug = `${slugify(input.name)}-${id.slice(-4)}`;
  const organizerToken = newId.secret();
  const zoneRows = [...new Set(input.zones.map((z) => z.trim()).filter(Boolean))].slice(0, 30).map((name) => ({ id: newId.zone(), eventId: id, name, slug: slugify(name) }));
  await db().transaction(async (tx) => {
    await tx.insert(events).values({ id, slug, name: input.name, organizerToken, crewCode: newId.crewCode(), nexconnGroupId: groupId, botUserId, isDemo: input.isDemo ?? false });
    if (zoneRows.length) await tx.insert(zones).values(zoneRows);
  });
  return { id, slug, organizerToken };
}

export async function joinCrew(input: { crewCode: string; name: string; zoneId: string | null; role?: "lead" | "volunteer"; simulated?: boolean }) {
  const [ev] = await db().select().from(events).where(eq(events.crewCode, input.crewCode));
  if (!ev) throw new DomainError("not_found", "This crew invite is invalid or was rotated. Ask your organizer for the new QR code.");
  if (ev.status === "ended") throw new DomainError("event_ended", "This event has ended");
  const memberId = newId.member();
  const nexconnUser = nexconnUserId.crew(memberId);
  await accessToken(nexconnUser, input.name);
  await requireNexconn().joinGroup(ev.nexconnGroupId, [nexconnUser]);
  await db().insert(members).values({
    id: memberId,
    eventId: ev.id,
    role: input.role ?? "volunteer",
    name: input.name.trim().slice(0, 40),
    zoneId: input.zoneId,
    nexconnUserId: nexconnUser,
    isSimulated: input.simulated ?? false,
  });
  return { eventId: ev.id, memberId };
}

export async function ensureAttendee(eventId: string, existingId?: string) {
  if (existingId) {
    const [a] = await db().select().from(attendees).where(and(eq(attendees.id, existingId), eq(attendees.eventId, eventId)));
    if (a) return a;
  }
  const id = newId.attendee();
  const [a] = await db().insert(attendees).values({ id, eventId, nexconnUserId: nexconnUserId.attendee(id) }).returning();
  return a;
}

export async function eventBySlug(slug: string) {
  const [ev] = await db().select().from(events).where(eq(events.slug, slug));
  return ev ?? null;
}

export async function eventById(id: string) {
  const [ev] = await db().select().from(events).where(eq(events.id, id));
  return ev ?? null;
}

export async function eventZones(eventId: string) {
  return db().select().from(zones).where(eq(zones.eventId, eventId));
}

export async function eventCrew(eventId: string) {
  return db().select().from(members).where(and(eq(members.eventId, eventId), isNull(members.removedAt)));
}
