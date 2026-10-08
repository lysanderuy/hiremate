import { sql } from "drizzle-orm";
import { boolean, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { jobs } from "./jobs";

export const skills = pgTable("skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  aliases: text("aliases")
    .array()
    .notNull()
    .default(sql`'{}'`),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const jobSkills = pgTable(
  "job_skills",
  {
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "restrict" }),
  },
  (table) => [primaryKey({ columns: [table.jobId, table.skillId] })],
);

export type Skill = typeof skills.$inferSelect;
export type NewSkill = typeof skills.$inferInsert;
export type JobSkill = typeof jobSkills.$inferSelect;
