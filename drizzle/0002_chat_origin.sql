ALTER TABLE "incidents" ADD COLUMN "origin" text DEFAULT 'report' NOT NULL;--> statement-breakpoint
ALTER TABLE "incidents" ADD COLUMN "source_message_id" text;--> statement-breakpoint
CREATE UNIQUE INDEX "incidents_source_message" ON "incidents" USING btree ("source_message_id");