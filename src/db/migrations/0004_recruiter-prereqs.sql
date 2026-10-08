CREATE TYPE "public"."match_band" AS ENUM('strong', 'fair', 'weak');--> statement-breakpoint
CREATE TYPE "public"."account_status" AS ENUM('active', 'pending', 'rejected', 'suspended');--> statement-breakpoint
ALTER TYPE "public"."application_status" ADD VALUE 'interview' BEFORE 'rejected';--> statement-breakpoint
ALTER TYPE "public"."application_status" ADD VALUE 'withdrawn';--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'administrator';--> statement-breakpoint
ALTER TYPE "public"."job_status" ADD VALUE 'removed';--> statement-breakpoint
CREATE TABLE "job_skills" (
	"job_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	CONSTRAINT "job_skills_job_id_skill_id_pk" PRIMARY KEY("job_id","skill_id")
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"aliases" text[] DEFAULT '{}' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "skills_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "applications" DROP CONSTRAINT "applications_resume_id_resumes_id_fk";
--> statement-breakpoint
ALTER TABLE "applications" DROP CONSTRAINT "applications_job_id_jobs_id_fk";
--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "resume_snapshot" text NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "skills_matched" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "skills_missing" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "match_score" integer;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "band" "match_band";--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "viewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "status_changed_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "account_status" "account_status" DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "approved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "removal_reason" text;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "salary_min" integer;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "salary_max" integer;--> statement-breakpoint
ALTER TABLE "jobs" ADD COLUMN "match_ready" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "job_skills" ADD CONSTRAINT "job_skills_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_skills" ADD CONSTRAINT "job_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" DROP COLUMN "resume_id";--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_match_score_check" CHECK ("applications"."match_score" between 0 and 100);--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_employment_type_check" CHECK ("jobs"."employment_type" in ('full_time','part_time','contract','internship'));--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_salary_pair_check" CHECK (("jobs"."salary_min" is null) = ("jobs"."salary_max" is null));--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_salary_order_check" CHECK ("jobs"."salary_min" <= "jobs"."salary_max");--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_salary_range_check" CHECK ("jobs"."salary_min" between 0 and 10000000 and "jobs"."salary_max" between 0 and 10000000);