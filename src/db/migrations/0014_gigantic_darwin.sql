ALTER TABLE "resumes" DROP CONSTRAINT "resumes_file_id_resume_files_id_fk";
--> statement-breakpoint
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_file_id_resume_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."resume_files"("id") ON DELETE no action ON UPDATE no action;