import { and, eq, inArray, isNotNull, isNull, lt, or, sql } from "drizzle-orm";
import type { Db } from "../db/client";
import { attendees, events, incidents, members, mergeSuggestions, notifications, reports, zones } from "../db/schema";
import type { NexconnApi } from "../nexconn/api";
import type { Effect } from "./incidents";

export const MSG_INCIDENT = "BTN:Incident";
export const MSG_STATUS = "BTN:Status";
export const MSG_NUDGE = "BTN:Nudge";

export type IncidentCardContent = {
  incidentId: string;
  number: number;
  title: string;
  category: string;
  zone: string | null;
  priority: "normal" | "urgent";
  createdAt: number;
};

/** Live state carried in Nexconn message metadata (all values must be strings; keys ≤ 32 chars). */
export type IncidentCardMetadata = { st: string; v: string; n: string; own: string; ownN: string; sug: string };

export type StatusState = "received" | "claimed" | "resolved";
const STATE_ORDER: StatusState[] = ["received", "claimed", "resolved"];

export type ProjectionLog = (msg: string, extra?: Record<string, unknown>) => void;

async function snapshot(db: Db, incidentId: string) {
  const [row] = await db
    .select({ inc: incidents, ev: events, zoneName: zones.name, ownerName: members.name })
    .from(incidents)
    .innerJoin(events, eq(events.id, incidents.eventId))
    .leftJoin(zones, eq(zones.id, incidents.zoneId))
    .leftJoin(members, eq(members.id, incidents.ownerMemberId))
    .where(eq(incidents.id, incidentId));
  if (!row) return null;
  const [sugg] = await db
    .select({ number: incidents.number })
    .from(mergeSuggestions)
    .innerJoin(incidents, eq(incidents.id, mergeSuggestions.candidateIncidentId))
    .where(and(eq(mergeSuggestions.incidentId, incidentId), eq(mergeSuggestions.status, "pending")));
  return { ...row, suggestionNumber: sugg?.number ?? null };
}

export function cardMetadata(s: NonNullable<Awaited<ReturnType<typeof snapshot>>>): IncidentCardMetadata {
  return {
    st: s.inc.status,
    v: String(s.inc.version),
    n: String(s.inc.reportCount),
    own: s.inc.ownerMemberId ?? "",
    ownN: s.ownerName ?? "",
    sug: s.suggestionNumber ? String(s.suggestionNumber) : "",
  };
}

function currentState(status: string): StatusState | null {
  if (status === "open") return "received";
  if (status === "claimed") return "claimed";
  if (status === "resolved") return "resolved";
  return null;
}

async function projectCard(db: Db, api: NexconnApi, incidentId: string) {
  const s = await snapshot(db, incidentId);
  if (!s) return;
  const metadata = cardMetadata(s);
  if (!s.inc.cardMessageId) {
    if (s.inc.status === "withdrawn") return;
    const content: IncidentCardContent = {
      incidentId: s.inc.id,
      number: s.inc.number,
      title: s.inc.title,
      category: s.inc.category,
      zone: s.zoneName,
      priority: s.inc.priority,
      createdAt: s.inc.createdAt.getTime(),
    };
    const messageId = await api.sendGroupMessage({
      fromUserId: s.ev.botUserId,
      groupId: s.ev.nexconnGroupId,
      messageType: MSG_INCIDENT,
      content,
      metadata,
      pushContent: `#${s.inc.number} ${s.inc.title}`,
    });
    // Only advance if nobody projected a newer version meanwhile.
    await db.update(incidents).set({ cardMessageId: messageId ?? null, projectedVersion: s.inc.version }).where(and(eq(incidents.id, incidentId), isNull(incidents.cardMessageId)));
    return;
  }
  await api.setMessageMetadata({ messageId: s.inc.cardMessageId, operatorUserId: s.ev.botUserId, groupId: s.ev.nexconnGroupId, metadata });
  await db.update(incidents).set({ projectedVersion: sql`greatest(${incidents.projectedVersion}, ${s.inc.version})` }).where(eq(incidents.id, incidentId));
}

/** Sends each attendee reporter one status message per state, deduped by the notifications primary key. */
async function notifyReporters(db: Db, api: NexconnApi, incidentId: string) {
  const s = await snapshot(db, incidentId);
  if (!s) return;
  const state = currentState(s.inc.status);
  if (!state) return;
  const reporters = await db
    .select({ nexconnUserId: attendees.nexconnUserId })
    .from(reports)
    .innerJoin(attendees, eq(attendees.id, reports.attendeeId))
    .where(and(eq(reports.incidentId, incidentId), eq(reports.source, "attendee")));
  const recipients = [...new Set(reporters.map((r) => r.nexconnUserId))];
  if (recipients.length === 0) return;

  const upTo = STATE_ORDER.slice(0, STATE_ORDER.indexOf(state) + 1);
  const fresh: string[] = [];
  for (const recipient of recipients) {
    // Earlier states are marked delivered too: a late reporter gets one message with the current state.
    const inserted = await db
      .insert(notifications)
      .values(upTo.map((st) => ({ incidentId, recipient, state: st })))
      .onConflictDoNothing()
      .returning({ state: notifications.state });
    if (inserted.some((r) => r.state === state)) fresh.push(recipient);
  }
  if (fresh.length === 0) return;
  try {
    await api.sendDirectMessage({
      fromUserId: s.ev.botUserId,
      toUserIds: fresh,
      messageType: MSG_STATUS,
      content: { incidentId, number: s.inc.number, state, ownerName: s.ownerName ?? "", reportCount: s.inc.reportCount, title: s.inc.title },
      pushContent: state === "resolved" ? "Fixed — thanks for reporting" : state === "claimed" ? `${s.ownerName ?? "Someone"} is on it` : "Sent to the crew",
    });
  } catch (err) {
    // Roll back the dedupe rows so the next attempt can deliver.
    await db.delete(notifications).where(and(eq(notifications.incidentId, incidentId), eq(notifications.state, state), inArray(notifications.recipient, fresh)));
    throw err;
  }
}

export async function applyEffects(db: Db, api: NexconnApi | null, effects: Effect[], log: ProjectionLog = console.warn) {
  if (!api) {
    log("Nexconn not configured — projection skipped; reconciliation will retry", { effects: effects.length });
    return { ok: false as const };
  }
  const seen = new Set<string>();
  let ok = true;
  for (const e of effects) {
    const key = e.type === "card.create" ? `card:${e.incidentId}` : e.type === "card.update" ? `card:${e.incidentId}` : `${e.type}:${e.incidentId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    try {
      if (e.type === "notify") await notifyReporters(db, api, e.incidentId);
      else await projectCard(db, api, e.incidentId);
    } catch (err) {
      ok = false;
      log("Projection failed; will be reconciled", { effect: e, error: err instanceof Error ? err.message : String(err) });
    }
  }
  return { ok };
}

/** Re-projects incidents whose Nexconn state lags the database (failed or skipped projections). */
export async function reconcile(db: Db, api: NexconnApi | null, log?: ProjectionLog) {
  const lagging = await db
    .select({ id: incidents.id })
    .from(incidents)
    .where(
      or(
        and(isNotNull(incidents.cardMessageId), lt(incidents.projectedVersion, incidents.version)),
        and(isNull(incidents.cardMessageId), inArray(incidents.status, ["open", "claimed"])),
      ),
    )
    .limit(50);
  if (lagging.length === 0) return { reconciled: 0 };
  await applyEffects(db, api, lagging.flatMap((r) => [{ type: "card.update" as const, incidentId: r.id }, { type: "notify" as const, incidentId: r.id }]), log);
  return { reconciled: lagging.length };
}
