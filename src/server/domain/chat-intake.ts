import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "../db/client";
import { events, members, zones } from "../db/schema";
import { detectRequest } from "./detection";
import { DomainError, submitReport, type SubmitReportResult } from "./incidents";

export const MSG_TEXT = "RC:TxtMsg";
const GROUP_CHANNEL = 3;

export type ChatRequestInput = {
  eventId: string;
  messageId: string;
  text: string;
  senderMemberId: string;
  /** auto = server detection from the webhook; manual = a crew member tapped "Make it a request". */
  mode: "auto" | "manual";
  actorMemberId?: string;
  now?: Date;
};

export type ChatRequestResult = { kind: "ignored"; reason: string } | ({ kind: "request" } & SubmitReportResult);

/** Turns a crew chat message into an incident whose live state is projected onto that same message. */
export async function requestFromChat(db: Db, input: ChatRequestInput): Promise<ChatRequestResult> {
  const text = input.text.trim();
  if (!text) return { kind: "ignored", reason: "empty" };
  const zs = await db.select({ id: zones.id, name: zones.name, slug: zones.slug }).from(zones).where(eq(zones.eventId, input.eventId));
  const detection = detectRequest(text, zs);
  if (!detection && input.mode === "auto") return { kind: "ignored", reason: "not_a_request" };
  const r = await submitReport(db, {
    eventId: input.eventId,
    source: "crew",
    memberId: input.senderMemberId,
    zoneId: detection?.zoneId ?? null,
    category: detection?.category ?? "other",
    text,
    structured: false, // free text: may suggest a merge, never auto-attaches
    priority: detection?.priority,
    sourceMessageId: input.messageId,
    now: input.now,
    auditPayload: { origin: "chat", mode: input.mode, reasons: detection?.reasons ?? [], by: input.actorMemberId ?? input.senderMemberId },
  });
  return { kind: "request", ...r };
}

/** Finds the live event and active crew member behind a Nexconn group message. */
export async function crewSender(db: Db, groupId: string, nexconnUserId: string) {
  const [row] = await db
    .select({ eventId: events.id, memberId: members.id, status: events.status })
    .from(members)
    .innerJoin(events, eq(events.id, members.eventId))
    .where(and(eq(events.nexconnGroupId, groupId), eq(members.nexconnUserId, nexconnUserId), isNull(members.removedAt)));
  return row ?? null;
}

// message:send data item (docs: platform-chat-api/webhook/message/send). Request bodies are untrusted.
const MessageSend = z.object({
  userId: z.string().min(1).max(64),
  channelId: z.string().min(1).max(64),
  messageType: z.string(),
  content: z.string().max(20_000),
  channelType: z.number(),
  time: z.number().optional(),
  messageId: z.string().min(1).max(64),
  os: z.string().optional(),
  groupUserIds: z.array(z.string()).optional(),
});

/** Handles one `message:send` item: crew text in an event group → detected request. Everything else is ignored. */
export async function handleMessageSend(db: Db, item: Record<string, unknown>): Promise<ChatRequestResult> {
  const parsed = MessageSend.safeParse(item);
  if (!parsed.success) return { kind: "ignored", reason: "malformed" };
  const m = parsed.data;
  if (m.channelType !== GROUP_CHANNEL || m.messageType !== MSG_TEXT) return { kind: "ignored", reason: "not_group_text" };
  if (m.os === "Server" || m.groupUserIds?.length) return { kind: "ignored", reason: "server_or_targeted" };
  const sender = await crewSender(db, m.channelId, m.userId);
  if (!sender) return { kind: "ignored", reason: "not_crew" };
  if (sender.status !== "live") return { kind: "ignored", reason: "event_ended" };
  let text = "";
  try {
    const c = JSON.parse(m.content) as { content?: unknown };
    text = typeof c.content === "string" ? c.content : "";
  } catch {
    return { kind: "ignored", reason: "malformed_content" };
  }
  try {
    return await requestFromChat(db, { eventId: sender.eventId, messageId: m.messageId, text, senderMemberId: sender.memberId, mode: "auto", now: m.time ? new Date(m.time) : undefined });
  } catch (err) {
    if (err instanceof DomainError && err.code === "event_ended") return { kind: "ignored", reason: "event_ended" };
    throw err;
  }
}
