import { sql } from "drizzle-orm";
import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { profiles } from "./profiles";

export const resumeSource = pgEnum("resume_source", ["pasted", "text_file", "pdf"]);
export const resumeState = pgEnum("resume_state", ["processing", "ready", "failed"]);

export const resumes = pgTable("resumes", {
  id: uuid("id").primaryKey().defaultRandom(),
  applicantId: uuid("applicant_id")
    .notNull()
    .unique()
    .references(() => profiles.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  source: resumeSource("source").notNull().default("pasted"),
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
