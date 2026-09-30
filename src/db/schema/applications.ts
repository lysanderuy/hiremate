import { pgEnum, pgTable, timestamp, unique, uuid } from "drizzle-orm/pg-core";

import { jobs } from "./jobs";
import { profiles } from "./profiles";
import { resumes } from "./resumes";

export const applicationStatus = pgEnum("application_status", [
  "submitted",
  "viewed",
  "shortlisted",
  "rejected",
]);

export const applications = pgTable(
  "applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    applicantId: uuid("applicant_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    resumeId: uuid("resume_id")
      .notNull()
      .references(() => resumes.id, { onDelete: "cascade" }),
    status: applicationStatus("status").notNull().default("submitted"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [unique().on(table.jobId, table.applicantId)],
);

export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
