import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { companies } from "./companies";
import { profiles } from "./profiles";

export const jobStatus = pgEnum("job_status", ["open", "closed", "removed"]);

export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "cascade" }),
    recruiterId: uuid("recruiter_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    location: text("location").notNull(),
    employmentType: text("employment_type").notNull(),
    status: jobStatus("status").notNull().default("open"),
    removalReason: text("removal_reason"),
    salaryMin: integer("salary_min"),
    salaryMax: integer("salary_max"),
    matchReady: boolean("match_ready").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check(
      "jobs_employment_type_check",
      sql`${table.employmentType} in ('full_time','part_time','contract','internship')`,
    ),
    check(
      "jobs_salary_pair_check",
      sql`(${table.salaryMin} is null) = (${table.salaryMax} is null)`,
    ),
    check("jobs_salary_order_check", sql`${table.salaryMin} <= ${table.salaryMax}`),
    check(
      "jobs_salary_range_check",
      sql`${table.salaryMin} between 0 and 10000000 and ${table.salaryMax} between 0 and 10000000`,
    ),
  ],
);

export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
