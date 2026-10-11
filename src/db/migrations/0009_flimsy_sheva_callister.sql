ALTER TABLE "resumes" ALTER COLUMN "source" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "resumes" ALTER COLUMN "source" SET DEFAULT 'pdf'::text;--> statement-breakpoint
DROP TYPE "public"."resume_source";--> statement-breakpoint
CREATE TYPE "public"."resume_source" AS ENUM('pdf');--> statement-breakpoint
ALTER TABLE "resumes" ALTER COLUMN "source" SET DEFAULT 'pdf'::"public"."resume_source";--> statement-breakpoint
ALTER TABLE "resumes" ALTER COLUMN "source" SET DATA TYPE "public"."resume_source" USING "source"::"public"."resume_source";--> statement-breakpoint
ALTER TABLE "resumes" ALTER COLUMN "state" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "resumes" ALTER COLUMN "state" SET DEFAULT 'ready'::text;--> statement-breakpoint
DROP TYPE "public"."resume_state";--> statement-breakpoint
CREATE TYPE "public"."resume_state" AS ENUM('ready', 'failed');--> statement-breakpoint
ALTER TABLE "resumes" ALTER COLUMN "state" SET DEFAULT 'ready'::"public"."resume_state";--> statement-breakpoint
ALTER TABLE "resumes" ALTER COLUMN "state" SET DATA TYPE "public"."resume_state" USING "state"::"public"."resume_state";