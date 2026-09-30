export const USER_ROLES = ["applicant", "recruiter"] as const;

export type UserRole = (typeof USER_ROLES)[number];
