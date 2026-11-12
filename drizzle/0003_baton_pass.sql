ALTER TABLE "incidents" ADD COLUMN "pass_to_member_id" text;--> statement-breakpoint
ALTER TABLE "incidents" ADD COLUMN "pass_note" text;--> statement-breakpoint
ALTER TABLE "incidents" ADD COLUMN "pass_offered_at" timestamp with time zone;