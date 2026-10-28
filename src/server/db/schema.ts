import { sql } from "drizzle-orm";
import { boolean, index, integer, jsonb, pgTable, primaryKey, real, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const events = pgTable("events", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  // Secret capability tokens. Rotating them invalidates old links/QR codes.
  organizerToken: text("organizer_token").notNull(),
  crewCode: text("crew_code").notNull().unique(),
  nexconnGroupId: text("nexconn_group_id").notNull(),
  botUserId: text("bot_user_id").notNull(),
  isDemo: boolean("is_demo").notNull().default(false),
  status: text("status", { enum: ["live", "ended"] }).notNull().default("live"),
  escalateAfterSec: integer("escalate_after_sec").notNull().default(120),
  urgentEscalateAfterSec: integer("urgent_escalate_after_sec").notNull().default(45),
  createdAt: createdAt(),
});

export const zones = pgTable(
  "zones",
  {
    id: text("id").primaryKey(),
    eventId: text("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    leadMemberId: text("lead_member_id"),
  },
  (t) => [uniqueIndex("zones_event_slug").on(t.eventId, t.slug)],
);

export const members = pgTable(
  "members",
  {
    id: text("id").primaryKey(),
    eventId: text("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["lead", "volunteer"] }).notNull(),
    name: text("name").notNull(),
    zoneId: text("zone_id"),
    onDuty: boolean("on_duty").notNull().default(true),
    nexconnUserId: text("nexconn_user_id").notNull().unique(),
    isSimulated: boolean("is_simulated").notNull().default(false),
    removedAt: timestamp("removed_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("members_event").on(t.eventId)],
);

export const attendees = pgTable("attendees", {
  id: text("id").primaryKey(),
  eventId: text("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  nexconnUserId: text("nexconn_user_id").notNull().unique(),
  isSimulated: boolean("is_simulated").notNull().default(false),
  createdAt: createdAt(),
});

export const CATEGORIES = ["supplies", "cleanliness", "directions", "tech", "lost_found", "medical", "safety", "other"] as const;
export type Category = (typeof CATEGORIES)[number];

export const incidents = pgTable(
  "incidents",
  {
    id: text("id").primaryKey(),
    eventId: text("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
    number: integer("number").notNull(),
    zoneId: text("zone_id"),
    category: text("category", { enum: CATEGORIES }).notNull(),
    priority: text("priority", { enum: ["normal", "urgent"] }).notNull().default("normal"),
    title: text("title").notNull(),
    // "chat": raised from a plain crew chat message; its live state is projected onto that same message.
    origin: text("origin", { enum: ["report", "chat"] }).notNull().default("report"),
    sourceMessageId: text("source_message_id"),
    status: text("status", { enum: ["open", "claimed", "resolved", "withdrawn"] }).notNull().default("open"),
    ownerMemberId: text("owner_member_id"),
    reportCount: integer("report_count").notNull().default(1),
    cardMessageId: text("card_message_id"),
    projectedVersion: integer("projected_version").notNull().default(0),
    version: integer("version").notNull().default(1),
    escalationLevel: integer("escalation_level").notNull().default(0),
    nextEscalationAt: timestamp("next_escalation_at", { withTimezone: true }),
    createdAt: createdAt(),
    claimedAt: timestamp("claimed_at", { withTimezone: true }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("incidents_event_number").on(t.eventId, t.number),
    uniqueIndex("incidents_source_message").on(t.sourceMessageId),
    index("incidents_event_status").on(t.eventId, t.status),
    index("incidents_escalation").on(t.nextEscalationAt).where(sql`status = 'open'`),
  ],
);

export const reports = pgTable(
  "reports",
  {
    id: text("id").primaryKey(),
    eventId: text("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
    incidentId: text("incident_id").notNull().references(() => incidents.id),
    source: text("source", { enum: ["attendee", "crew"] }).notNull(),
    attendeeId: text("attendee_id"),
    memberId: text("member_id"),
    zoneId: text("zone_id"),
    category: text("category", { enum: CATEGORIES }).notNull(),
    text: text("text").notNull().default(""),
    structured: boolean("structured").notNull(),
    attachedBy: text("attached_by", { enum: ["new", "auto", "merge"] }).notNull().default("new"),
    createdAt: createdAt(),
  },
  (t) => [index("reports_incident").on(t.incidentId)],
);

export const mergeSuggestions = pgTable("merge_suggestions", {
  id: text("id").primaryKey(),
  eventId: text("event_id").notNull(),
  incidentId: text("incident_id").notNull(),
  candidateIncidentId: text("candidate_incident_id").notNull(),
  score: real("score").notNull(),
  status: text("status", { enum: ["pending", "merged", "dismissed"] }).notNull().default("pending"),
  createdAt: createdAt(),
});

// Append-only audit trail of every state transition.
export const incidentEvents = pgTable(
  "incident_events",
  {
    id: text("id").primaryKey(),
    incidentId: text("incident_id").notNull(),
    actor: text("actor").notNull(),
    type: text("type").notNull(),
    payload: jsonb("payload").notNull().default({}),
    at: createdAt(),
  },
  (t) => [index("incident_events_incident").on(t.incidentId)],
);

// Fan-out dedupe: one status message per (incident, recipient, state).
export const notifications = pgTable(
  "notifications",
  {
    incidentId: text("incident_id").notNull(),
    recipient: text("recipient").notNull(),
    state: text("state").notNull(),
    at: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.incidentId, t.recipient, t.state] })],
);

export const webhookEvents = pgTable("webhook_events", {
  eventId: text("event_id").primaryKey(),
  type: text("type").notNull(),
  payload: jsonb("payload").notNull().default({}),
  deliveries: integer("deliveries").notNull().default(1),
  receivedAt: createdAt(),
});

export const nexconnTokens = pgTable("nexconn_tokens", {
  nexconnUserId: text("nexconn_user_id").primaryKey(),
  token: text("token").notNull(),
  issuedAt: createdAt(),
});
