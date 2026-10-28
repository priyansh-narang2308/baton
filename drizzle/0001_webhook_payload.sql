ALTER TABLE "webhook_events" ADD COLUMN "payload" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "webhook_events" ADD COLUMN "deliveries" integer DEFAULT 1 NOT NULL;