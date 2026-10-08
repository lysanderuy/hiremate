import { z } from "zod";

import { ACCOUNT_STATUSES, APP_ROLES } from "@/types/roles";

// Example validator — replace/extend per project.
export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .optional()
    .meta({ description: "Display name shown throughout the app.", example: "Jane Doe" }),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const profileResponseSchema = z
  .object({
    id: z.string().uuid().meta({
      description: "Profile ID (matches the Supabase auth user ID).",
      example: "5f8d0d55-1c8b-4e2a-9c3d-7e6b1a2f4d90",
    }),
    email: z
      .string()
      .email()
      .meta({ description: "Account email address.", example: "jane@example.com" }),
    displayName: z
      .string()
      .nullable()
      .meta({ description: "Display name shown throughout the app.", example: "Jane Doe" }),
    jobTitle: z
      .string()
      .nullable()
      .meta({ description: "Job title, set at signup for recruiters.", example: "Talent Lead" }),
    role: z.enum(APP_ROLES).meta({
      description: "Account role, chosen at signup and read-only afterwards.",
      example: "applicant",
    }),
    accountStatus: z.enum(ACCOUNT_STATUSES).meta({
      description: "Account approval status. Recruiters start as pending until approved.",
      example: "active",
    }),
    rejectionReason: z.string().nullable().meta({
      description: "Reason given when the account was rejected.",
      example: "Company could not be verified.",
    }),
    approvedAt: z.string().datetime().nullable().meta({
      description: "Timestamp the account was approved.",
      example: "2026-01-02T08:00:00.000Z",
    }),
    createdAt: z.string().datetime().meta({
      description: "Timestamp the profile was created.",
      example: "2026-01-01T00:00:00.000Z",
    }),
    updatedAt: z.string().datetime().meta({
      description: "Timestamp the profile was last updated.",
      example: "2026-01-15T09:30:00.000Z",
    }),
  })
  .meta({ id: "Profile", description: "A user profile." });

export type ProfileResponse = z.infer<typeof profileResponseSchema>;
