CREATE TABLE "resume_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"data" "bytea" NOT NULL,
	"byte_size" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "resume_file_id" uuid;--> statement-breakpoint
ALTER TABLE "resumes" ADD COLUMN "file_id" uuid;--> statement-breakpoint
ALTER TABLE "resume_files" ADD CONSTRAINT "resume_files_owner_id_profiles_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_resume_file_id_resume_files_id_fk" FOREIGN KEY ("resume_file_id") REFERENCES "public"."resume_files"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_file_id_resume_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."resume_files"("id") ON DELETE set null ON UPDATE no action;