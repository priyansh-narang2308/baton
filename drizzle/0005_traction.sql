CREATE TABLE "traction_console_snapshots" (
	"id" text PRIMARY KEY NOT NULL,
	"metric" text NOT NULL,
	"value" integer NOT NULL,
	"period_start" timestamp with time zone NOT NULL,
	"period_end" timestamp with time zone NOT NULL,
	"console_path" text NOT NULL,
	"captured_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "traction_exclusions" (
	"nexconn_user_id" text PRIMARY KEY NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "traction_feedback" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text,
	"role" text NOT NULL,
	"quote" text NOT NULL,
	"rating" integer,
	"attribution" text DEFAULT 'anonymous' NOT NULL,
	"attribution_name" text,
	"permission_note" text NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"collected_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "traction_pilots" (
	"event_id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"public_name" text NOT NULL,
	"public_context" text DEFAULT '' NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"verification_note" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "traction_feedback" ADD CONSTRAINT "traction_feedback_event_id_traction_pilots_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."traction_pilots"("event_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "traction_pilots" ADD CONSTRAINT "traction_pilots_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;