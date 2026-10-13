ALTER TABLE "resume_files" ADD COLUMN "file_name" text DEFAULT 'resume.pdf' NOT NULL;--> statement-breakpoint
CREATE INDEX "applications_resume_file_id_idx" ON "applications" USING btree ("resume_file_id");--> statement-breakpoint
CREATE INDEX "resume_files_owner_id_idx" ON "resume_files" USING btree ("owner_id");