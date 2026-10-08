import { z } from "zod";

import { APPLICATION_STATUSES } from "@/types/applications";
import { applicationIdSchema } from "@/validators/application.validator";

const statField = (description: string, example: number) =>
  z.number().int().min(0).meta({ description, example });

export const recentApplicationSchema = z.object({
  id: applicationIdSchema,
  jobId: z.string().uuid().meta({
    description: "ID of the listing applied to.",
    example: "7c1f2b0a-5d4e-4a63-9b8c-1e2d3f4a5b6c",
  }),
  jobTitle: z.string().meta({
    description: "Title of the listing applied to.",
    example: "Senior Frontend Engineer",
  }),
  applicantName: z.string().nullable().meta({
    description: "Applicant display name, if they set one.",
    example: "Maria Santos",
  }),
  matchScore: z.number().int().nullable().meta({
    description: "Match score from 0 to 100, or null if not scored.",
    example: 82,
  }),
  status: z.enum(APPLICATION_STATUSES).meta({
    description: "Application status.",
    example: "submitted",
  }),
  createdAt: z.string().datetime().meta({
    description: "Timestamp the application was submitted.",
    example: "2026-10-06T09:30:00.000Z",
  }),
});

export const dashboardResponseSchema = z
  .object({
    stats: z.object({
      activeJobs: statField("Listings currently open.", 4),
      totalApplicants: statField("Applications across all listings.", 148),
      shortlisted: statField("Applications with status shortlisted.", 32),
      interviews: statField("Applications with status interview.", 8),
      awaitingReview: statField("Applications with status submitted, not yet viewed.", 5),
      last7Days: statField("Applications received in the last 7 days.", 21),
    }),
    recentApplications: z.array(recentApplicationSchema).meta({
      description: "The most recent applications across all listings.",
    }),
  })
  .meta({ id: "Dashboard", description: "Summary figures for the recruiter dashboard." });

export type RecentApplicationResponse = z.infer<typeof recentApplicationSchema>;
export type DashboardResponse = z.infer<typeof dashboardResponseSchema>;
