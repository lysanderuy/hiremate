import { z } from "zod";

import { JOB_STATUSES } from "@/types/jobs";
import { ACCOUNT_STATUSES, APP_ROLES } from "@/types/roles";

import { APPLICATION_BANDS } from "./application.validator";

export const ADMIN_DASHBOARD_DAYS = 30;
export const ADMIN_DASHBOARD_TOP_SKILLS = 10;

const countSchema = z.number().int().min(0);

export const adminDashboardResponseSchema = z
  .object({
    totalUsers: countSchema.meta({ description: "All user accounts.", example: 120 }),
    usersByRole: z.record(z.enum(APP_ROLES), countSchema).meta({
      description: "User counts per role. Every role is present.",
      example: { applicant: 90, recruiter: 28, administrator: 2 },
    }),
    usersByStatus: z.record(z.enum(ACCOUNT_STATUSES), countSchema).meta({
      description: "User counts per account status. Every status is present.",
      example: { active: 110, pending: 5, rejected: 2, suspended: 3 },
    }),
    listingsByStatus: z.record(z.enum(JOB_STATUSES), countSchema).meta({
      description: "Listing counts per status. Every status is present.",
      example: { open: 30, closed: 10, removed: 2 },
    }),
    totalApplications: countSchema.meta({
      description: "All application rows, withdrawn included.",
      example: 640,
    }),
    applicationsPerDay: z
      .array(
        z.object({
          date: z.string().meta({ description: "UTC day, YYYY-MM-DD.", example: "2026-01-01" }),
          count: countSchema.meta({ description: "Applications created that day.", example: 7 }),
        }),
      )
      .length(ADMIN_DASHBOARD_DAYS)
      .meta({
        description: `Applications per UTC day for the last ${ADMIN_DASHBOARD_DAYS} days ending today, oldest first, zero-filled.`,
      }),
    averageMatchScore: z.number().min(0).max(100).nullable().meta({
      description:
        "Mean match score across every application with a score, rounded to 1 decimal. Null when none has a score.",
      example: 64.3,
    }),
    topSkills: z
      .array(
        z.object({
          name: z.string().meta({ description: "Skill name.", example: "TypeScript" }),
          count: countSchema.meta({ description: "Open listings requesting it.", example: 12 }),
        }),
      )
      .max(ADMIN_DASHBOARD_TOP_SKILLS)
      .meta({ description: "Most requested skills across open listings, highest first." }),
    openListingsWithoutApplications: countSchema.meta({
      description: "Open listings that have no application rows.",
      example: 4,
    }),
    attention: z
      .object({
        pendingRecruiters: countSchema.meta({
          description: "Recruiters waiting for approval.",
          example: 5,
        }),
        openListingsWithoutApplications: countSchema.meta({
          description: "Open listings that have no application rows.",
          example: 4,
        }),
        preparingListings: countSchema.meta({
          description: "Listings of any status that are not match-ready yet.",
          example: 1,
        }),
      })
      .meta({ description: "Counts behind the Needs attention card." }),
    hiddenOpenListings: countSchema.meta({
      description: "Open listings hidden from Jobs because the recruiter account is not active.",
      example: 2,
    }),
    matchBands: z.record(z.enum(APPLICATION_BANDS), countSchema).meta({
      description:
        "Applications per saved match band. Applications without a score are not counted. Every band is present.",
      example: { strong: 120, fair: 300, weak: 90 },
    }),
    averageMatchBand: z.enum(APPLICATION_BANDS).nullable().meta({
      description:
        "Band of averageMatchScore, from the model's band cutoffs. Null when averageMatchScore is null.",
      example: "fair",
    }),
    matcher: z
      .object({
        model: z.string().meta({ description: "Model name.", example: "Ridge regression" }),
        version: z.string().meta({ description: "Model version label.", example: "v20261016" }),
        skillCount: countSchema.meta({ description: "Skills in the shipped list.", example: 389 }),
        pairs: countSchema.meta({
          description: "Rated pairs the model was trained on.",
          example: 600,
        }),
        trainedAt: z.string().meta({
          description: "ISO timestamp of the training run.",
          example: "2026-10-16T00:56:53+00:00",
        }),
        resumesFailed: countSchema.meta({
          description: "Resumes whose processing failed (live count).",
          example: 0,
        }),
      })
      .meta({ description: "Read-only matcher facts from the shipped model, plus a live count." }),
  })
  .meta({ id: "AdminDashboard", description: "Platform-wide statistics for administrators." });

export type AdminDashboardResponse = z.infer<typeof adminDashboardResponseSchema>;
