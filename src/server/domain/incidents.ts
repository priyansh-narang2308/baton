import { and, desc, eq, gte, inArray, isNull, lte, sql } from "drizzle-orm";
import type { Db } from "../db/client";
import { attendees, events, incidentEvents, incidents, members, mergeSuggestions, reports, zones, type Category } from "../db/schema";
import { newId } from "../ids";
import { CANDIDATE_WINDOW_MIN, decide, type Candidate } from "./consolidation";

/** Side effects to project onto Nexconn after the transaction commits. */
export type Effect =
  | { type: "card.create"; incidentId: string }
  | { type: "card.update"; incidentId: string }
  | { type: "notify"; incidentId: string }
  /** Tell one crew member, privately inside the crew group, that a lead assigned them an incident. */
  | { type: "assigned"; incidentId: string; memberId: string; byName: string }
  /** Baton Pass: tell one crew member privately that a pass was offered to them, or answered. */
  | { type: "pass"; incidentId: string; memberId: string; kind: "offered" | "accepted" | "declined"; byName: string; note?: string };

/** Any change of owner or status ends a pending Baton Pass. */
const NO_PASS = { passToMemberId: null, passNote: null, passOfferedAt: null } as const;

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
  /** Set when the report is a crew chat message: the incident's live state goes onto that message. */
  sourceMessageId?: string;
  auditPayload?: Record<string, unknown>;
  now?: Date;
};

export type SubmitReportResult = {
  reportId: string;
  incidentId: string;
  outcome: "new" | "attached" | "new_with_suggestion" | "existing";
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
    if (input.sourceMessageId) {
      // Idempotent per chat message: webhook retries and a manual "make it a request" race resolve to one incident.
      const [existing] = await tx.select().from(incidents).where(eq(incidents.sourceMessageId, input.sourceMessageId));
      if (existing) {
        const [rep] = await tx.select({ id: reports.id }).from(reports).where(eq(reports.incidentId, existing.id)).limit(1);
        return { reportId: rep?.id ?? "", incidentId: existing.id, outcome: "existing", reportCount: existing.reportCount, effects: [] };
      }
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
      origin: input.sourceMessageId ? "chat" : "report",
      sourceMessageId: input.sourceMessageId,
      cardMessageId: input.sourceMessageId,
      nextEscalationAt: escalationTime(priority, ev, now),
      createdAt: now,
    });
    await tx.insert(reports).values({ id: reportId, eventId: ev.id, incidentId, source: input.source, attendeeId: input.attendeeId, memberId: input.memberId, zoneId: input.zoneId, category: input.category, text: input.text, structured: input.structured, createdAt: now });
    await audit(tx, incidentId, actor, "incident.created", { reportId, priority, ...input.auditPayload });
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
      .set({ ...NO_PASS, status: "open", ownerMemberId: null, claimedAt: null, nextEscalationAt: escalationTime(inc.priority, ev, now), version: sql`${incidents.version} + 1` })
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
      .set({ ...NO_PASS, status: "resolved", resolvedAt: now, nextEscalationAt: null, ownerMemberId: inc.ownerMemberId ?? memberId, version: sql`${incidents.version} + 1` })
      .where(and(eq(incidents.id, incidentId), eq(incidents.version, inc.version)))
      .returning();
    if (!updated) throw new DomainError("conflict", "The incident changed — refresh and try again");
    await audit(tx, incidentId, memberId, "incident.resolved");
    return { incident: updated, effects: [{ type: "card.update", incidentId }, { type: "notify", incidentId }] as Effect[] };
  });
}

/**
 * A lead hands an open or claimed incident to a specific crew member. Version-checked, so a concurrent claim or
 * resolve wins cleanly instead of being overwritten. The original claim time is kept on reassignment so
 * time-to-claim still measures how long the incident waited for its first owner.
 */
export async function assignIncident(db: Db, eventId: string, incidentId: string, actorMemberId: string, assigneeMemberId: string, now = new Date()) {
  return db.transaction(async (tx) => {
    const actor = await activeMember(tx, actorMemberId, eventId);
    if (actor.role !== "lead") throw new DomainError("forbidden", "Only a lead can assign requests");
    const [assignee] = await tx.select().from(members).where(and(eq(members.id, assigneeMemberId), eq(members.eventId, eventId), isNull(members.removedAt)));
    if (!assignee) throw new DomainError("invalid", "That person is not on this event's crew");
    const inc = await loadIncident(tx, incidentId, eventId);
    if (inc.status === "resolved" || inc.status === "withdrawn") throw new DomainError("conflict", `This incident is ${inc.status === "withdrawn" ? "merged" : "already fixed"}`, { status: inc.status });
    if (inc.status === "claimed" && inc.ownerMemberId === assigneeMemberId) return { incident: inc, effects: [] as Effect[], unchanged: true };
    const [updated] = await tx
      .update(incidents)
      .set({ ...NO_PASS, status: "claimed", ownerMemberId: assigneeMemberId, claimedAt: inc.claimedAt ?? now, nextEscalationAt: null, version: sql`${incidents.version} + 1` })
      .where(and(eq(incidents.id, incidentId), eq(incidents.version, inc.version)))
      .returning();
    if (!updated) throw new DomainError("conflict", "The incident changed — refresh and try again");
    await audit(tx, incidentId, actorMemberId, "incident.assigned", { assigneeId: assigneeMemberId, previousOwnerId: inc.ownerMemberId });
    const effects: Effect[] = [{ type: "card.update", incidentId }, { type: "notify", incidentId }];
    if (assigneeMemberId !== actorMemberId) effects.push({ type: "assigned", incidentId, memberId: assigneeMemberId, byName: actor.name });
    return { incident: updated, effects, unchanged: false };
  });
}

/**
 * Baton Pass, step 1: the owner offers their incident to one teammate. The owner stays the owner until the teammate
 * accepts, so the incident is never left without someone responsible. A new offer replaces a pending one.
 */
export async function offerPass(db: Db, eventId: string, incidentId: string, ownerId: string, toMemberId: string, note: string, now = new Date()) {
  return db.transaction(async (tx) => {
    const owner = await activeMember(tx, ownerId, eventId);
    if (toMemberId === ownerId) throw new DomainError("invalid", "Pick someone else to pass this to");
    const [to] = await tx.select().from(members).where(and(eq(members.id, toMemberId), eq(members.eventId, eventId), isNull(members.removedAt)));
    if (!to) throw new DomainError("invalid", "That person is not on this event's crew");
    const inc = await loadIncident(tx, incidentId, eventId);
    if (inc.status !== "claimed") throw new DomainError("conflict", `This incident is ${inc.status === "open" ? "not claimed yet" : inc.status}`, { status: inc.status });
    if (inc.ownerMemberId !== ownerId) throw new DomainError("forbidden", "Only the current owner can pass this on");
    const trimmed = note.trim().slice(0, 280) || null;
    const [updated] = await tx
      .update(incidents)
      .set({ passToMemberId: toMemberId, passNote: trimmed, passOfferedAt: now, version: sql`${incidents.version} + 1` })
      .where(and(eq(incidents.id, incidentId), eq(incidents.version, inc.version)))
      .returning();
    if (!updated) throw new DomainError("conflict", "The incident changed — refresh and try again");
    await audit(tx, incidentId, ownerId, "pass.offered", { toId: toMemberId, note: trimmed, replacedId: inc.passToMemberId });
    return {
      incident: updated,
      effects: [{ type: "card.update", incidentId }, { type: "pass", incidentId, memberId: toMemberId, kind: "offered", byName: owner.name, note: trimmed ?? undefined }] as Effect[],
    };
  });
}

/**
 * Baton Pass, step 2: the named teammate takes it. One conditional UPDATE moves ownership only if the pass is still
 * addressed to them and the incident is still claimed by the person who offered it, so a release, reassignment or
 * fix that lands first makes this fail cleanly instead of overwriting it.
 */
export async function acceptPass(db: Db, eventId: string, incidentId: string, memberId: string, now = new Date()) {
  return db.transaction(async (tx) => {
    const me = await activeMember(tx, memberId, eventId);
    const inc = await loadIncident(tx, incidentId, eventId);
    if (inc.status === "claimed" && inc.ownerMemberId === memberId && !inc.passToMemberId) return { incident: inc, effects: [] as Effect[], alreadyYours: true };
    if (inc.passToMemberId !== memberId || inc.status !== "claimed" || !inc.ownerMemberId) {
      throw new DomainError("conflict", "This pass is no longer open", { status: inc.status, ownerName: await ownerName(tx, inc.ownerMemberId) });
    }
    const fromId = inc.ownerMemberId;
    const [updated] = await tx
      .update(incidents)
      .set({ ...NO_PASS, ownerMemberId: memberId, version: sql`${incidents.version} + 1` })
      .where(and(eq(incidents.id, incidentId), eq(incidents.status, "claimed"), eq(incidents.ownerMemberId, fromId), eq(incidents.passToMemberId, memberId)))
      .returning();
    if (!updated) throw new DomainError("conflict", "This pass is no longer open");
    await audit(tx, incidentId, memberId, "pass.accepted", { fromId, waitedSec: inc.passOfferedAt ? Math.round((now.getTime() - inc.passOfferedAt.getTime()) / 1000) : null });
    return {
      incident: updated,
      effects: [{ type: "card.update", incidentId }, { type: "pass", incidentId, memberId: fromId, kind: "accepted", byName: me.name }] as Effect[],
      alreadyYours: false,
    };
  });
}

/** Baton Pass: the teammate says no (the owner keeps it and is told), or the owner withdraws the offer. */
export async function endPass(db: Db, eventId: string, incidentId: string, memberId: string, how: "declined" | "cancelled") {
  return db.transaction(async (tx) => {
    const me = await activeMember(tx, memberId, eventId);
    const inc = await loadIncident(tx, incidentId, eventId);
    if (!inc.passToMemberId) return { incident: inc, effects: [] as Effect[] };
    const allowed = how === "declined" ? inc.passToMemberId === memberId : inc.ownerMemberId === memberId || me.role === "lead";
    if (!allowed) throw new DomainError("forbidden", how === "declined" ? "This pass isn't addressed to you" : "Only the owner can cancel this pass");
    const [updated] = await tx
      .update(incidents)
      .set({ ...NO_PASS, version: sql`${incidents.version} + 1` })
      .where(and(eq(incidents.id, incidentId), eq(incidents.version, inc.version)))
      .returning();
    if (!updated) throw new DomainError("conflict", "The incident changed — refresh and try again");
    await audit(tx, incidentId, memberId, `pass.${how}`, { toId: inc.passToMemberId });
    const effects: Effect[] = [{ type: "card.update", incidentId }];
    if (how === "declined" && inc.ownerMemberId) effects.push({ type: "pass", incidentId, memberId: inc.ownerMemberId, kind: "declined", byName: me.name });
    return { incident: updated, effects };
  });
}

export type ActivityEntry = { id: string; type: string; at: number; actorName: string; actorKind: "crew" | "attendee" | "system"; detail: Record<string, unknown> };
export type ReportEntry = {
  id: string;
  source: "attendee" | "crew";
  reporterName: string;
  simulated: boolean;
  text: string;
  zoneName: string | null;
  category: string;
  attachedBy: "new" | "auto" | "merge";
  fromChat: boolean;
  createdAt: number;
};

/** Everything that happened to one incident, for the detail view: every report behind it and its full audit trail. */
export async function incidentDetail(db: Db, eventId: string, incidentId: string) {
  const [inc] = await db.select().from(incidents).where(and(eq(incidents.id, incidentId), eq(incidents.eventId, eventId)));
  if (!inc) throw new DomainError("not_found", "Incident not found");
  const [reps, log, crew, zs, atts] = await Promise.all([
    db.select().from(reports).where(eq(reports.incidentId, incidentId)).orderBy(reports.createdAt),
    db.select().from(incidentEvents).where(eq(incidentEvents.incidentId, incidentId)).orderBy(incidentEvents.at),
    db.select({ id: members.id, name: members.name, isSimulated: members.isSimulated }).from(members).where(eq(members.eventId, eventId)),
    db.select({ id: zones.id, name: zones.name }).from(zones).where(eq(zones.eventId, eventId)),
    db.select({ id: attendees.id, isSimulated: attendees.isSimulated }).from(attendees).where(eq(attendees.eventId, eventId)),
  ]);
  const crewById = new Map(crew.map((m) => [m.id, m]));
  const zoneById = new Map(zs.map((z) => [z.id, z.name]));
  const attById = new Map(atts.map((a) => [a.id, a]));
  // Incidents referenced by merges, so the timeline can say "#4" instead of an id.
  const related = [...new Set(log.flatMap((e) => [e.payload as Record<string, unknown>]).flatMap((p) => [p.targetId, p.sourceId, p.candidateIncidentId, p.newIncidentId, p.fromIncidentId]).filter((v): v is string => typeof v === "string"))];
  const relatedNumbers = related.length ? await db.select({ id: incidents.id, number: incidents.number }).from(incidents).where(inArray(incidents.id, related)) : [];
  const numberById = new Map(relatedNumbers.map((r) => [r.id, r.number]));

  const actorOf = (actor: string): Pick<ActivityEntry, "actorName" | "actorKind"> => {
    if (actor === "system") return { actorName: "Baton", actorKind: "system" };
    const m = crewById.get(actor);
    if (m) return { actorName: m.name, actorKind: "crew" };
    return { actorName: attById.get(actor)?.isSimulated ? "Simulated attendee" : "Attendee", actorKind: "attendee" };
  };
  const activity: ActivityEntry[] = log.map((e) => {
    const p = { ...(e.payload as Record<string, unknown>) };
    for (const k of ["targetId", "sourceId", "candidateIncidentId", "newIncidentId", "fromIncidentId"]) {
      if (typeof p[k] === "string" && numberById.has(p[k] as string)) p[`${k.replace(/Id$/, "")}Number`] = numberById.get(p[k] as string);
    }
    for (const k of ["assigneeId", "previousOwnerId", "toId", "fromId", "replacedId"]) {
      if (typeof p[k] === "string") p[`${k.replace(/Id$/, "")}Name`] = crewById.get(p[k] as string)?.name ?? null;
    }
    return { id: e.id, type: e.type, at: e.at.getTime(), ...actorOf(e.actor), detail: p };
  });
  const reportEntries: ReportEntry[] = reps.map((r) => {
    const m = r.memberId ? crewById.get(r.memberId) : undefined;
    const a = r.attendeeId ? attById.get(r.attendeeId) : undefined;
    return {
      id: r.id,
      source: r.source,
      reporterName: m ? m.name : a?.isSimulated ? "Simulated attendee" : "Attendee",
      simulated: Boolean(m?.isSimulated || a?.isSimulated),
      text: r.text,
      zoneName: r.zoneId ? (zoneById.get(r.zoneId) ?? null) : null,
      category: r.category,
      attachedBy: r.attachedBy,
      fromChat: inc.origin === "chat" && r.id === reps[0]?.id,
      createdAt: r.createdAt.getTime(),
    };
  });
  const sec = (a: Date | null, b: Date | null) => (a && b ? Math.round((b.getTime() - a.getTime()) / 1000) : null);
  return {
    incident: {
      id: inc.id,
      number: inc.number,
      status: inc.status,
      ownerMemberId: inc.ownerMemberId,
      ownerName: inc.ownerMemberId ? (crewById.get(inc.ownerMemberId)?.name ?? null) : null,
      escalationLevel: inc.escalationLevel,
      timeToClaimSec: sec(inc.createdAt, inc.claimedAt),
      timeToFixSec: sec(inc.createdAt, inc.resolvedAt),
    },
    reports: reportEntries,
    activity,
  };
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

/** "Not a request": undoes a chat detection. Only while nobody else reported it and nobody owns it. */
export async function dismissDetection(db: Db, eventId: string, incidentId: string, memberId: string) {
  return db.transaction(async (tx) => {
    const actor = await activeMember(tx, memberId, eventId);
    const [inc] = await tx.select().from(incidents).where(and(eq(incidents.id, incidentId), eq(incidents.eventId, eventId))).for("update");
    if (!inc) throw new DomainError("not_found", "Incident not found");
    if (inc.origin !== "chat") throw new DomainError("invalid", "Only requests detected in chat can be dismissed");
    if (inc.status === "withdrawn") return { effects: [] as Effect[] };
    if (inc.status !== "open") throw new DomainError("conflict", `This request is already ${inc.status}`, { status: inc.status });
    if (inc.reportCount > 1) throw new DomainError("conflict", "Others reported this too — resolve it instead");
    const [rep] = await tx.select({ memberId: reports.memberId }).from(reports).where(eq(reports.incidentId, inc.id));
    if (rep?.memberId !== memberId && actor.role !== "lead") throw new DomainError("forbidden", "Only the sender or a lead can dismiss this");
    await tx.update(incidents).set({ status: "withdrawn", nextEscalationAt: null, version: sql`${incidents.version} + 1` }).where(eq(incidents.id, inc.id));
    await tx.update(mergeSuggestions).set({ status: "dismissed" }).where(and(eq(mergeSuggestions.incidentId, inc.id), eq(mergeSuggestions.status, "pending")));
    await audit(tx, inc.id, memberId, "detection.dismissed");
    return { effects: [{ type: "card.update", incidentId: inc.id }] as Effect[] };
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
      passToName: crew.find((c) => c.id === r.passToMemberId)?.name ?? null,
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


export type HuddleOutcome = "connected" | "no_answer" | "declined" | "cancelled" | "failed";

/**
 * Records a Nexconn Call voice huddle in the incident timeline. The caller's browser reports it once the call ends
 * (from the SDK's local call log), so the duration is as the caller's app measured it. One entry per call ID.
 */
export async function logHuddle(
  db: Db,
  eventId: string,
  incidentId: string,
  memberId: string,
  input: { callId: string; withMemberId: string; outcome: HuddleOutcome; durationSec: number },
) {
  return db.transaction(async (tx) => {
    await activeMember(tx, memberId, eventId);
    const other = await activeMember(tx, input.withMemberId, eventId).catch(() => {
      throw new DomainError("invalid", "That person is not on this event's crew");
    });
    if (input.withMemberId === memberId) throw new DomainError("invalid", "You can't call yourself");
    await loadIncident(tx, incidentId, eventId);
    const [dup] = await tx
      .select({ id: incidentEvents.id })
      .from(incidentEvents)
      .where(and(eq(incidentEvents.incidentId, incidentId), eq(incidentEvents.type, "huddle.ended"), sql`${incidentEvents.payload}->>'callId' = ${input.callId}`));
    if (dup) return { logged: false };
    const durationSec = input.outcome === "connected" ? Math.max(0, Math.min(Math.round(input.durationSec), 4 * 3600)) : 0;
    await audit(tx, incidentId, memberId, "huddle.ended", {
      callId: input.callId,
      withMemberId: other.id,
      withName: other.name,
      outcome: input.outcome,
      durationSec,
    });
    return { logged: true };
  });
}
