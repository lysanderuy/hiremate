import { sql } from "drizzle-orm";
import { customType, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { profiles } from "./profiles";

export const resumeSource = pgEnum("resume_source", ["pdf"]);
export const resumeState = pgEnum("resume_state", ["ready", "failed"]);

const bytea = customType<{ data: Buffer }>({
  dataType() {
    return "bytea";
  },
});

export const resumeFiles = pgTable("resume_files", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  data: bytea("data").notNull(),
  byteSize: integer("byte_size").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const resumes = pgTable("resumes", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicantId: uuid("applicant_id")
    .notNull()
    .unique()
    .references(() => profiles.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  fileId: uuid("file_id").references(() => resumeFiles.id, { onDelete: "set null" }),
  source: resumeSource("source").notNull().default("pdf"),
  state: resumeState("state").notNull().default("ready"),
  skills: text("skills")
    .array()
    .notNull()
    .default(sql`'{}'`),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Resume = typeof resumes.$inferSelect;
export type NewResume = typeof resumes.$inferInsert;

export type ResumeFile = typeof resumeFiles.$inferSelect;
export type NewResumeFile = typeof resumeFiles.$inferInsert;
