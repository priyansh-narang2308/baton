import { and, desc, eq, gte, inArray, isNull, lte, sql } from "drizzle-orm";
import type { Db } from "../db/client";
import { events, incidentEvents, incidents, members, mergeSuggestions, reports, zones, type Category } from "../db/schema";
import { newId } from "../ids";
import { CANDIDATE_WINDOW_MIN, decide, type Candidate } from "./consolidation";

/** Side effects to project onto Nexconn after the transaction commits. */
export type Effect =
  | { type: "card.create"; incidentId: string }
  | { type: "card.update"; incidentId: string }
  | { type: "notify"; incidentId: string };

export class DomainError extends Error {
  constructor(
    readonly code: "not_found" | "forbidden" | "conflict" | "invalid" | "event_ended" | "rate_limited",
    message: string,
    readonly details: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

const CATEGORY_TITLES: Record<Category, string> = {
  supplies: "Water & supplies",
  cleanliness: "Cleanliness",
  directions: "Directions & info",
  tech: "Tech / AV",
  lost_found: "Lost & found",
  medical: "Medical",
  safety: "Safety",
  other: "Other",
};

export function incidentTitle(category: Category, text: string): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  return trimmed ? (trimmed.length > 80 ? `${trimmed.slice(0, 77)}…` : trimmed) : CATEGORY_TITLES[category];
}

async function audit(tx: Tx, incidentId: string, actor: string, type: string, payload: Record<string, unknown> = {}) {
  await tx.insert(incidentEvents).values({ id: newId.audit(), incidentId, actor, type, payload });
}

function escalationTime(priority: "normal" | "urgent", ev: { escalateAfterSec: number; urgentEscalateAfterSec: number }, from = new Date()) {
  const sec = priority === "urgent" ? ev.urgentEscalateAfterSec : ev.escalateAfterSec;
  return new Date(from.getTime() + sec * 1000);
}

export type SubmitReportInput = {
  eventId: string;
  source: "attendee" | "crew";
  attendeeId?: string;
  memberId?: string;
  zoneId: string | null;
  category: Category;
  text: string;
  structured: boolean;
  priority?: "normal" | "urgent";
  now?: Date;
};

export type SubmitReportResult = {
  reportId: string;
  incidentId: string;
  outcome: "new" | "attached" | "new_with_suggestion";
  reportCount: number;
  effects: Effect[];
};

/** Creates a report and decides — inside one per-event serialized transaction — whether it starts or joins an incident. */
export async function submitReport(db: Db, input: SubmitReportInput): Promise<SubmitReportResult> {
  const now = input.now ?? new Date();
  const priority = input.priority ?? (input.category === "medical" || input.category === "safety" ? "urgent" : "normal");
  return db.transaction(async (tx) => {
    // Serialize report intake per event: consolidation and incident numbering must see each other's writes.
    const [ev] = await tx.select().from(events).where(eq(events.id, input.eventId)).for("update");
    if (!ev) throw new DomainError("not_found", "Event not found");
    if (ev.status === "ended") throw new DomainError("event_ended", "This event has ended");
    if (input.zoneId) {
      const [z] = await tx.select({ id: zones.id }).from(zones).where(and(eq(zones.id, input.zoneId), eq(zones.eventId, ev.id)));
      if (!z) throw new DomainError("invalid", "Unknown zone for this event");
    }

    const since = new Date(now.getTime() - CANDIDATE_WINDOW_MIN * 60_000);
    const open = await tx
      .select({ id: incidents.id, zoneId: incidents.zoneId, category: incidents.category, createdAt: incidents.createdAt, status: incidents.status })
      .from(incidents)
      .where(and(eq(incidents.eventId, ev.id), inArray(incidents.status, ["open", "claimed"]), gte(incidents.createdAt, since)));
    const texts = open.length
      ? await tx.select({ incidentId: reports.incidentId, text: reports.text }).from(reports).where(inArray(reports.incidentId, open.map((o) => o.id)))
      : [];
    const candidates: Candidate[] = open.map((o) => ({
      incidentId: o.id,
      zoneId: o.zoneId,
      category: o.category,
      createdAt: o.createdAt,
      status: o.status,
      texts: texts.filter((t) => t.incidentId === o.id).map((t) => t.text),
    }));
    const decision = decide({ zoneId: input.zoneId, category: input.category, text: input.text, structured: input.structured, at: now }, candidates);
    const reportId = newId.report();
    const actor = input.memberId ?? input.attendeeId ?? "system";

    if (decision.kind === "attach") {
      const [inc] = await tx
        .update(incidents)
        .set({ reportCount: sql`${incidents.reportCount} + 1`, version: sql`${incidents.version} + 1` })
        .where(eq(incidents.id, decision.incidentId))
        .returning();
      await tx.insert(reports).values({ id: reportId, eventId: ev.id, incidentId: inc.id, source: input.source, attendeeId: input.attendeeId, memberId: input.memberId, zoneId: input.zoneId, category: input.category, text: input.text, structured: input.structured, attachedBy: "auto", createdAt: now });
      await audit(tx, inc.id, actor, "report.attached", { reportId, score: decision.score });
      return { reportId, incidentId: inc.id, outcome: "attached", reportCount: inc.reportCount, effects: [{ type: "card.update", incidentId: inc.id }, { type: "notify", incidentId: inc.id }] };
    }

    const [{ next }] = await tx
      .select({ next: sql<number>`coalesce(max(${incidents.number}), 0) + 1` })
      .from(incidents)
      .where(eq(incidents.eventId, ev.id));
    const incidentId = newId.incident();
    await tx.insert(incidents).values({
      id: incidentId,
      eventId: ev.id,
      number: Number(next),
      zoneId: input.zoneId,
      category: input.category,
      priority,
      title: incidentTitle(input.category, input.text),
      nextEscalationAt: escalationTime(priority, ev, now),
      createdAt: now,
    });
    await tx.insert(reports).values({ id: reportId, eventId: ev.id, incidentId, source: input.source, attendeeId: input.attendeeId, memberId: input.memberId, zoneId: input.zoneId, category: input.category, text: input.text, structured: input.structured, createdAt: now });
    await audit(tx, incidentId, actor, "incident.created", { reportId, priority });
    if (decision.kind === "suggest") {
      await tx.insert(mergeSuggestions).values({ id: newId.suggestion(), eventId: ev.id, incidentId, candidateIncidentId: decision.incidentId, score: decision.score });
      await audit(tx, incidentId, "system", "merge.suggested", { candidateIncidentId: decision.incidentId, score: decision.score });
    }
    return {
      reportId,
      incidentId,
      outcome: decision.kind === "suggest" ? "new_with_suggestion" : "new",
      reportCount: 1,
      effects: [{ type: "card.create", incidentId }, { type: "notify", incidentId }],
    };
  });
}

async function activeMember(tx: Tx, memberId: string, eventId: string) {
  const [m] = await tx.select().from(members).where(and(eq(members.id, memberId), eq(members.eventId, eventId), isNull(members.removedAt)));
  if (!m) throw new DomainError("forbidden", "You are not on this event's crew");
  return m;
}

async function loadIncident(tx: Tx, incidentId: string, eventId: string) {
  const [inc] = await tx.select().from(incidents).where(and(eq(incidents.id, incidentId), eq(incidents.eventId, eventId)));
  if (!inc) throw new DomainError("not_found", "Incident not found");
  return inc;
}

async function ownerName(tx: Tx, memberId: string | null) {
  if (!memberId) return null;
  const [m] = await tx.select({ name: members.name }).from(members).where(eq(members.id, memberId));
  return m?.name ?? null;
}

/** Atomic claim: exactly one caller wins `open → claimed`; everyone else gets a conflict naming the owner. */
export async function claimIncident(db: Db, eventId: string, incidentId: string, memberId: string, now = new Date()) {
  return db.transaction(async (tx) => {
    await activeMember(tx, memberId, eventId);
    const [won] = await tx
      .update(incidents)
      .set({ status: "claimed", ownerMemberId: memberId, claimedAt: now, nextEscalationAt: null, version: sql`${incidents.version} + 1` })
      .where(and(eq(incidents.id, incidentId), eq(incidents.eventId, eventId), eq(incidents.status, "open")))
      .returning();
    if (!won) {
      const inc = await loadIncident(tx, incidentId, eventId);
      if (inc.status === "claimed" && inc.ownerMemberId === memberId) return { incident: inc, effects: [] as Effect[], alreadyYours: true };
      throw new DomainError("conflict", inc.status === "claimed" ? "Someone else already claimed this" : `This incident is ${inc.status}`, {
        status: inc.status,
        ownerMemberId: inc.ownerMemberId,
        ownerName: await ownerName(tx, inc.ownerMemberId),
        version: inc.version,
      });
    }
    await audit(tx, incidentId, memberId, "incident.claimed");
    return { incident: won, effects: [{ type: "card.update", incidentId }, { type: "notify", incidentId }] as Effect[], alreadyYours: false };
  });
}

export async function releaseIncident(db: Db, eventId: string, incidentId: string, memberId: string, now = new Date()) {
  return db.transaction(async (tx) => {
    const actor = await activeMember(tx, memberId, eventId);
    const [ev] = await tx.select().from(events).where(eq(events.id, eventId));
    const inc = await loadIncident(tx, incidentId, eventId);
    if (inc.status !== "claimed") throw new DomainError("conflict", `This incident is ${inc.status}`, { status: inc.status, version: inc.version });
    if (inc.ownerMemberId !== memberId && actor.role !== "lead") throw new DomainError("forbidden", "Only the owner or a lead can release this");
    const [updated] = await tx
      .update(incidents)
      .set({ status: "open", ownerMemberId: null, claimedAt: null, nextEscalationAt: escalationTime(inc.priority, ev, now), version: sql`${incidents.version} + 1` })
      .where(and(eq(incidents.id, incidentId), eq(incidents.version, inc.version)))
      .returning();
    if (!updated) throw new DomainError("conflict", "The incident changed — refresh and try again");
    await audit(tx, incidentId, memberId, "incident.released");
    return { incident: updated, effects: [{ type: "card.update", incidentId }] as Effect[] };
  });
}

export async function resolveIncident(db: Db, eventId: string, incidentId: string, memberId: string, now = new Date()) {
  return db.transaction(async (tx) => {
    const actor = await activeMember(tx, memberId, eventId);
    const inc = await loadIncident(tx, incidentId, eventId);
    if (inc.status === "resolved") return { incident: inc, effects: [] as Effect[] };
    if (inc.status === "withdrawn") throw new DomainError("conflict", "This incident was merged into another one", { status: inc.status });
    if (inc.status === "claimed" && inc.ownerMemberId !== memberId && actor.role !== "lead") {
      throw new DomainError("forbidden", "Only the owner or a lead can mark this fixed");
    }
    const [updated] = await tx
      .update(incidents)
      .set({ status: "resolved", resolvedAt: now, nextEscalationAt: null, ownerMemberId: inc.ownerMemberId ?? memberId, version: sql`${incidents.version} + 1` })
      .where(and(eq(incidents.id, incidentId), eq(incidents.version, inc.version)))
      .returning();
    if (!updated) throw new DomainError("conflict", "The incident changed — refresh and try again");
    await audit(tx, incidentId, memberId, "incident.resolved");
    return { incident: updated, effects: [{ type: "card.update", incidentId }, { type: "notify", incidentId }] as Effect[] };
  });
}

/** Moves every report of `sourceId` into `targetId`. The source is kept (status withdrawn) so history stays traceable. */
export async function mergeIncidents(db: Db, eventId: string, sourceId: string, targetId: string, memberId: string) {
  if (sourceId === targetId) throw new DomainError("invalid", "Cannot merge an incident into itself");
  return db.transaction(async (tx) => {
    await activeMember(tx, memberId, eventId);
    const [src] = await tx.select().from(incidents).where(and(eq(incidents.id, sourceId), eq(incidents.eventId, eventId))).for("update");
    const [dst] = await tx.select().from(incidents).where(and(eq(incidents.id, targetId), eq(incidents.eventId, eventId))).for("update");
    if (!src || !dst) throw new DomainError("not_found", "Incident not found");
    if (src.status === "withdrawn" || src.status === "resolved") throw new DomainError("conflict", `Incident #${src.number} is ${src.status}`);
    if (dst.status === "withdrawn") throw new DomainError("conflict", `Incident #${dst.number} was merged elsewhere`);
    const moved = await tx.update(reports).set({ incidentId: dst.id, attachedBy: "merge" }).where(eq(reports.incidentId, src.id)).returning({ id: reports.id });
    await tx.update(incidents).set({ status: "withdrawn", reportCount: 0, nextEscalationAt: null, version: sql`${incidents.version} + 1` }).where(eq(incidents.id, src.id));
    await tx.update(incidents).set({ reportCount: sql`${incidents.reportCount} + ${moved.length}`, version: sql`${incidents.version} + 1` }).where(eq(incidents.id, dst.id));
    await tx.update(mergeSuggestions).set({ status: "merged" }).where(and(eq(mergeSuggestions.incidentId, src.id), eq(mergeSuggestions.status, "pending")));
    await audit(tx, src.id, memberId, "incident.merged_into", { targetId: dst.id, reportIds: moved.map((r) => r.id) });
    await audit(tx, dst.id, memberId, "incident.merged_from", { sourceId: src.id, reportIds: moved.map((r) => r.id) });
    return {
      targetId: dst.id,
      effects: [{ type: "card.update", incidentId: src.id }, { type: "card.update", incidentId: dst.id }, { type: "notify", incidentId: dst.id }] as Effect[],
    };
  });
}

export async function dismissSuggestion(db: Db, eventId: string, incidentId: string, memberId: string) {
  return db.transaction(async (tx) => {
    await activeMember(tx, memberId, eventId);
    await tx.update(mergeSuggestions).set({ status: "dismissed" }).where(and(eq(mergeSuggestions.incidentId, incidentId), eq(mergeSuggestions.eventId, eventId), eq(mergeSuggestions.status, "pending")));
    await tx.update(incidents).set({ version: sql`${incidents.version} + 1` }).where(eq(incidents.id, incidentId));
    await audit(tx, incidentId, memberId, "merge.dismissed");
    return { effects: [{ type: "card.update", incidentId }] as Effect[] };
  });
}

/** Restores one report to its own incident (undo for a wrong grouping). */
export async function splitReport(db: Db, eventId: string, reportId: string, memberId: string, now = new Date()) {
  return db.transaction(async (tx) => {
    await activeMember(tx, memberId, eventId);
    const [ev] = await tx.select().from(events).where(eq(events.id, eventId)).for("update");
    const [rep] = await tx.select().from(reports).where(and(eq(reports.id, reportId), eq(reports.eventId, eventId)));
    if (!rep) throw new DomainError("not_found", "Report not found");
    const [old] = await tx.select().from(incidents).where(eq(incidents.id, rep.incidentId)).for("update");
    if (old.reportCount <= 1) throw new DomainError("invalid", "This report is already on its own");
    const [{ next }] = await tx.select({ next: sql<number>`coalesce(max(${incidents.number}), 0) + 1` }).from(incidents).where(eq(incidents.eventId, eventId));
    const incidentId = newId.incident();
    const priority = rep.category === "medical" || rep.category === "safety" ? "urgent" : "normal";
    await tx.insert(incidents).values({ id: incidentId, eventId, number: Number(next), zoneId: rep.zoneId, category: rep.category, priority, title: incidentTitle(rep.category, rep.text), nextEscalationAt: escalationTime(priority, ev, now), createdAt: now });
    await tx.update(reports).set({ incidentId, attachedBy: "new" }).where(eq(reports.id, rep.id));
    await tx.update(incidents).set({ reportCount: sql`${incidents.reportCount} - 1`, version: sql`${incidents.version} + 1` }).where(eq(incidents.id, old.id));
    await audit(tx, old.id, memberId, "report.split_out", { reportId, newIncidentId: incidentId });
    await audit(tx, incidentId, memberId, "incident.created_from_split", { reportId, fromIncidentId: old.id });
    return { incidentId, effects: [{ type: "card.update", incidentId: old.id }, { type: "card.create", incidentId }, { type: "notify", incidentId }] as Effect[] };
  });
}

/** Claims due escalations (SKIP LOCKED so parallel workers never double-escalate) and schedules the next level. */
export async function takeDueEscalations(db: Db, now = new Date(), limit = 20) {
  return db.transaction(async (tx) => {
    const due = await tx
      .select()
      .from(incidents)
      .where(and(eq(incidents.status, "open"), lte(incidents.nextEscalationAt, now)))
      .orderBy(incidents.nextEscalationAt)
      .limit(limit)
      .for("update", { skipLocked: true });
    const out: { incident: typeof incidents.$inferSelect; level: number }[] = [];
    for (const inc of due) {
      const level = inc.escalationLevel + 1;
      // Level 1 → zone lead, level 2 → event leads, then stop (no notification storms).
      const next = level >= 2 ? null : new Date(now.getTime() + 2 * 60_000);
      await tx.update(incidents).set({ escalationLevel: level, nextEscalationAt: next }).where(eq(incidents.id, inc.id));
      await audit(tx, inc.id, "system", "incident.escalated", { level });
      out.push({ incident: inc, level });
    }
    return out;
  });
}

export async function escalationTargets(db: Db, incident: { eventId: string; zoneId: string | null }, level: number) {
  const crew = await db.select().from(members).where(and(eq(members.eventId, incident.eventId), isNull(members.removedAt), eq(members.onDuty, true)));
  if (level === 1 && incident.zoneId) {
    const [zone] = await db.select().from(zones).where(eq(zones.id, incident.zoneId));
    const zoneLead = crew.find((m) => m.id === zone?.leadMemberId);
    if (zoneLead) return [zoneLead];
  }
  return crew.filter((m) => m.role === "lead");
}

/** Board/crew read model: authoritative incident list for one event. */
export async function listIncidents(db: Db, eventId: string) {
  const rows = await db.select().from(incidents).where(and(eq(incidents.eventId, eventId), inArray(incidents.status, ["open", "claimed", "resolved"]))).orderBy(desc(incidents.createdAt)).limit(200);
  const crew = await db.select({ id: members.id, name: members.name }).from(members).where(eq(members.eventId, eventId));
  const zs = await db.select({ id: zones.id, name: zones.name }).from(zones).where(eq(zones.eventId, eventId));
  const sugg = await db.select().from(mergeSuggestions).where(and(eq(mergeSuggestions.eventId, eventId), eq(mergeSuggestions.status, "pending")));
  const numberById = new Map(rows.map((r) => [r.id, r.number]));
  return rows.map((r) => {
    const s = sugg.find((x) => x.incidentId === r.id);
    return {
      ...r,
      ownerName: crew.find((c) => c.id === r.ownerMemberId)?.name ?? null,
      zoneName: zs.find((z) => z.id === r.zoneId)?.name ?? null,
      suggestion: s ? { candidateIncidentId: s.candidateIncidentId, candidateNumber: numberById.get(s.candidateIncidentId) ?? null, score: s.score } : null,
    };
  });
}

export async function attendeeReports(db: Db, attendeeId: string) {
  return db
    .select({ reportId: reports.id, incidentId: incidents.id, number: incidents.number, status: incidents.status, title: incidents.title, reportCount: incidents.reportCount, ownerName: members.name, createdAt: reports.createdAt, claimedAt: incidents.claimedAt, resolvedAt: incidents.resolvedAt })
    .from(reports)
    .innerJoin(incidents, eq(incidents.id, reports.incidentId))
    .leftJoin(members, eq(members.id, incidents.ownerMemberId))
    .where(eq(reports.attendeeId, attendeeId))
    .orderBy(desc(reports.createdAt));
}

