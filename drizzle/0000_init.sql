CREATE TABLE "attendees" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"nexconn_user_id" text NOT NULL,
	"is_simulated" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attendees_nexconn_user_id_unique" UNIQUE("nexconn_user_id")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"organizer_token" text NOT NULL,
	"crew_code" text NOT NULL,
	"nexconn_group_id" text NOT NULL,
	"bot_user_id" text NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'live' NOT NULL,
	"escalate_after_sec" integer DEFAULT 120 NOT NULL,
	"urgent_escalate_after_sec" integer DEFAULT 45 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_slug_unique" UNIQUE("slug"),
	CONSTRAINT "events_crew_code_unique" UNIQUE("crew_code")
);
--> statement-breakpoint
CREATE TABLE "incident_events" (
	"id" text PRIMARY KEY NOT NULL,
	"incident_id" text NOT NULL,
	"actor" text NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "incidents" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"number" integer NOT NULL,
	"zone_id" text,
	"category" text NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"title" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"owner_member_id" text,
	"report_count" integer DEFAULT 1 NOT NULL,
	"card_message_id" text,
	"projected_version" integer DEFAULT 0 NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"escalation_level" integer DEFAULT 0 NOT NULL,
	"next_escalation_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"claimed_at" timestamp with time zone,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"role" text NOT NULL,
	"name" text NOT NULL,
	"zone_id" text,
	"on_duty" boolean DEFAULT true NOT NULL,
	"nexconn_user_id" text NOT NULL,
	"is_simulated" boolean DEFAULT false NOT NULL,
	"removed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "members_nexconn_user_id_unique" UNIQUE("nexconn_user_id")
);
--> statement-breakpoint
CREATE TABLE "merge_suggestions" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"incident_id" text NOT NULL,
	"candidate_incident_id" text NOT NULL,
	"score" real NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "nexconn_tokens" (
	"nexconn_user_id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"incident_id" text NOT NULL,
	"recipient" text NOT NULL,
	"state" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notifications_incident_id_recipient_state_pk" PRIMARY KEY("incident_id","recipient","state")
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"incident_id" text NOT NULL,
	"source" text NOT NULL,
	"attendee_id" text,
	"member_id" text,
	"zone_id" text,
	"category" text NOT NULL,
	"text" text DEFAULT '' NOT NULL,
	"structured" boolean NOT NULL,
	"attached_by" text DEFAULT 'new' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"event_id" text PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zones" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"lead_member_id" text
);
--> statement-breakpoint
ALTER TABLE "attendees" ADD CONSTRAINT "attendees_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_incident_id_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."incidents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "zones" ADD CONSTRAINT "zones_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "incident_events_incident" ON "incident_events" USING btree ("incident_id");--> statement-breakpoint
CREATE UNIQUE INDEX "incidents_event_number" ON "incidents" USING btree ("event_id","number");--> statement-breakpoint
CREATE INDEX "incidents_event_status" ON "incidents" USING btree ("event_id","status");--> statement-breakpoint
CREATE INDEX "incidents_escalation" ON "incidents" USING btree ("next_escalation_at") WHERE status = 'open';--> statement-breakpoint
CREATE INDEX "members_event" ON "members" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "reports_incident" ON "reports" USING btree ("incident_id");--> statement-breakpoint
CREATE UNIQUE INDEX "zones_event_slug" ON "zones" USING btree ("event_id","slug");