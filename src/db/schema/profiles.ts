import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { ACCOUNT_STATUSES, APP_ROLES } from "@/types/roles";

export const userRole = pgEnum("user_role", APP_ROLES);

export const accountStatus = pgEnum("account_status", ACCOUNT_STATUSES);

// `id` mirrors `auth.users.id`.
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull(),
  displayName: text("display_name"),
  jobTitle: text("job_title"),
  role: userRole("role").notNull().default("applicant"),
  accountStatus: accountStatus("account_status").notNull().default("active"),
  rejectionReason: text("rejection_reason"),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
