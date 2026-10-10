CREATE TYPE "public"."resume_source" AS ENUM('pasted', 'text_file', 'pdf');--> statement-breakpoint
CREATE TYPE "public"."resume_state" AS ENUM('processing', 'ready', 'failed');--> statement-breakpoint
ALTER TABLE "resumes" ADD COLUMN "source" "resume_source" DEFAULT 'pasted' NOT NULL;--> statement-breakpoint
ALTER TABLE "resumes" ADD COLUMN "state" "resume_state" DEFAULT 'ready' NOT NULL;--> statement-breakpoint
ALTER TABLE "resumes" ADD COLUMN "skills" text[] DEFAULT '{}' NOT NULL;