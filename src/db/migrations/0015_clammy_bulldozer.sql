ALTER TABLE "applications" ADD COLUMN "model_version" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "embedding" real[];--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "prepare_attempted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "resumes" ADD COLUMN "embedding" real[];--> statement-breakpoint
ALTER TABLE "resumes" ADD COLUMN "prepare_attempted_at" timestamp with time zone;