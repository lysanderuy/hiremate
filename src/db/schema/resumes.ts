import { sql } from "drizzle-orm";
import {
  customType,
  index,
  integer,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { profiles } from "./profiles";

export const resumeSource = pgEnum("resume_source", ["pdf"]);
export const resumeState = pgEnum("resume_state", ["ready", "failed"]);

const bytea = customType<{ data: Buffer }>({
  dataType() {
    return "bytea";
  },
});

export const resumeFiles = pgTable(
  "resume_files",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    fileName: text("file_name").notNull().default("resume.pdf"),
    data: bytea("data").notNull(),
    byteSize: integer("byte_size").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("resume_files_owner_id_idx").on(table.ownerId)],
);

export const resumes = pgTable("resumes", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicantId: uuid("applicant_id")
    .notNull()
    .unique()
    .references(() => profiles.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  fileId: uuid("file_id")
    .notNull()
    .references(() => resumeFiles.id, { onDelete: "no action" }),
  source: resumeSource("source").notNull().default("pdf"),
  state: resumeState("state").notNull().default("ready"),
  skills: text("skills")
    .array()
    .notNull()
    .default(sql`'{}'`),
  embedding: real("embedding").array(),
  prepareAttemptedAt: timestamp("prepare_attempted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Resume = typeof resumes.$inferSelect;
export type NewResume = typeof resumes.$inferInsert;

export type ResumeFile = typeof resumeFiles.$inferSelect;
export type NewResumeFile = typeof resumeFiles.$inferInsert;
