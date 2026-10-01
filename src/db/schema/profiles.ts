import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { USER_ROLES } from "@/types/roles";

export const userRole = pgEnum("user_role", USER_ROLES);

// `id` mirrors `auth.users.id`.
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull(),
  displayName: text("display_name"),
  jobTitle: text("job_title"),
  role: userRole("role").notNull().default("applicant"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
