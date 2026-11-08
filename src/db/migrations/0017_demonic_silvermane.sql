ALTER TABLE "profiles" ADD COLUMN "suspended_from" "account_status";--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "review_requested_at" timestamp with time zone;