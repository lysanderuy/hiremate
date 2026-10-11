UPDATE "resumes" SET "source" = 'pdf' WHERE "source" <> 'pdf';--> statement-breakpoint
UPDATE "resumes" SET "state" = 'failed' WHERE "state" = 'processing';
