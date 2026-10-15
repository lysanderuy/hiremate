import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import type { MatchBreakdown } from "@/validators/application.validator";

import { jobs } from "./jobs";
import { profiles } from "./profiles";
import { resumeFiles } from "./resumes";

export const applicationStatus = pgEnum("application_status", [
  "submitted",
  "viewed",
  "shortlisted",
  "interview",
  "rejected",
  "withdrawn",
]);

export const matchBand = pgEnum("match_band", ["strong", "fair", "weak"]);

export const applications = pgTable(
  "applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "restrict" }),
    applicantId: uuid("applicant_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    resumeSnapshot: text("resume_snapshot").notNull(),
    resumeFileId: uuid("resume_file_id")
      .notNull()
      .references(() => resumeFiles.id, { onDelete: "no action" }),
    skillsMatched: text("skills_matched")
      .array()
      .notNull()
      .default(sql`'{}'`),
    skillsMissing: text("skills_missing")
      .array()
      .notNull()
      .default(sql`'{}'`),
    matchScore: integer("match_score"),
    band: matchBand("band"),
    matchBreakdown: jsonb("match_breakdown").$type<MatchBreakdown>(),
    modelVersion: text("model_version"),
    status: applicationStatus("status").notNull().default("submitted"),
    viewedAt: timestamp("viewed_at", { withTimezone: true }),
    statusChangedAt: timestamp("status_changed_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("applications_job_applicant_active_idx")
      .on(table.jobId, table.applicantId)
      .where(sql`${table.status} <> 'withdrawn'`),
    index("applications_resume_file_id_idx").on(table.resumeFileId),
    check("applications_match_score_check", sql`${table.matchScore} between 0 and 100`),
  ],
);

export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
