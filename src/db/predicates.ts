import "server-only";

import { sql } from "drizzle-orm";

import { applications } from "@/db/schema";

// Keeps only the newest application per applicant and job, so a withdraw/re-apply history lists one row.
export const latestApplicationOnly = sql`not exists (
  select 1 from applications as newer
  where newer.job_id = ${applications.jobId}
    and newer.applicant_id = ${applications.applicantId}
    and (newer.created_at, newer.id) > (${applications.createdAt}, ${applications.id})
)`;
