import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "../db/client";
import { webhookEvents } from "../db/schema";

// Envelope documented at platform-chat-api/webhook/overview: { type, id, time, data[] }
export const WebhookEnvelope = z.object({
  type: z.string().min(1),
  id: z.string().min(1),
  time: z.number(),
  data: z.array(z.record(z.string(), z.unknown())).default([]),
});
export type WebhookEnvelope = z.infer<typeof WebhookEnvelope>;

/** Records a webhook delivery. Returns false when this event id was already processed (Nexconn retries up to 3×). */
export async function recordWebhook(db: Db, env: WebhookEnvelope): Promise<boolean> {
  const inserted = await db
    .insert(webhookEvents)
    .values({ eventId: env.id, type: env.type, payload: env as unknown as Record<string, unknown> })
    .onConflictDoNothing()
    .returning({ id: webhookEvents.eventId });
  if (inserted.length === 0) {
    await db.update(webhookEvents).set({ deliveries: sql`${webhookEvents.deliveries} + 1` }).where(eq(webhookEvents.eventId, env.id));
    return false;
  }
  return true;
}
