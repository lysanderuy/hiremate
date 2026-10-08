export const USER_ROLES = ["applicant", "recruiter"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const APP_ROLES = [...USER_ROLES, "administrator"] as const;

export type AppRole = (typeof APP_ROLES)[number];

export const ACCOUNT_STATUSES = ["active", "pending", "rejected", "suspended"] as const;

export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];
