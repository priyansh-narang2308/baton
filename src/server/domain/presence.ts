import { and, gt, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "../db/client";
import { presenceSessions } from "../db/schema";

// platform-chat-api/webhook/user/connection-status: status "0" connected, "1" disconnected, "2" logged out.
export const ConnectionStatus = z.object({
  status: z.union([z.string(), z.number()]).transform(String),
  userId: z.string().min(1),
  time: z.number(),
  sessionId: z.string().optional(),
});

/** A session left "online" this long without any event is treated as stale (the docs promise an offline event within 5 min). */
const STALE_AFTER_MS = 12 * 60 * 60 * 1000;

/** Records one connection change. Ignores events older than what we already have for that session. */
export async function applyConnectionStatus(db: Db, raw: unknown): Promise<boolean> {
  const parsed = ConnectionStatus.safeParse(raw);
  if (!parsed.success) return false;
  const { status, userId, time, sessionId } = parsed.data;
  const online = status === "0";
  const changedAt = new Date(time);
  await db
    .insert(presenceSessions)
    .values({ nexconnUserId: userId, sessionId: sessionId || "default", online, changedAt })
    .onConflictDoUpdate({
      target: [presenceSessions.nexconnUserId, presenceSessions.sessionId],
      set: { online, changedAt },
      setWhere: sql`${presenceSessions.changedAt} <= excluded.changed_at`,
    });
  return true;
}

/**
 * Which of these Nexconn users are online right now.
 * `tracked` is false until the first presence webhook ever arrives, so the UI can show "unknown" rather than
 * claiming everyone is offline when the Console event isn't switched on.
 */
export async function presenceFor(db: Db, userIds: string[], now = Date.now()): Promise<{ tracked: boolean; online: Set<string> }> {
  const [any] = await db.select({ one: sql<number>`1` }).from(presenceSessions).limit(1);
  if (!any || userIds.length === 0) return { tracked: Boolean(any), online: new Set() };
  const rows = await db
    .selectDistinct({ id: presenceSessions.nexconnUserId })
    .from(presenceSessions)
    .where(and(inArray(presenceSessions.nexconnUserId, userIds), sql`${presenceSessions.online}`, gt(presenceSessions.changedAt, new Date(now - STALE_AFTER_MS))));
  return { tracked: true, online: new Set(rows.map((r) => r.id)) };
}
