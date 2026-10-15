import { z } from "zod";

import { APPLICANT_APPLICATION_STATUSES, APPLICATION_STATUSES } from "@/types/applications";
import { APPLICATION_BANDS, applicationIdSchema } from "@/validators/application.validator";
import { matchSummarySchema, openListingIdSchema } from "@/validators/open-listing.validator";
import { resumeSourceSchema, resumeStateSchema } from "@/validators/resume.validator";

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
  band: z.enum(APPLICATION_BANDS).nullable().meta({
    description: "Match band, or null if not scored.",
    example: "strong",
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

export const applicantDashboardResponseSchema = z
  .object({
    resume: z.object({
      state: resumeStateSchema.nullable().meta({
        description: "Resume state, or null when the applicant has no resume.",
        example: "ready",
      }),
      source: resumeSourceSchema.nullable().meta({
        description: "How the resume was provided, or null when there is none.",
        example: "pdf",
      }),
      skillCount: statField("Skills found in the resume.", 12),
      updatedAt: z.string().datetime().nullable().meta({
        description: "Timestamp the resume was last saved, or null when there is none.",
        example: "2026-10-06T09:30:00.000Z",
      }),
    }),
    applications: z.object({
      total: statField("All of the applicant's applications.", 9),
      shortlisted: statField("Applications shortlisted, including interviews.", 2),
      waiting: statField("Applications submitted and not yet viewed.", 3),
    }),
    recent: z
      .array(
        z.object({
          id: applicationIdSchema,
          jobTitle: z.string().meta({
            description: "Title of the listing applied to.",
            example: "Senior Frontend Engineer",
          }),
          companyName: z.string().meta({ description: "Company name.", example: "Acme Corp" }),
          status: z.enum(APPLICANT_APPLICATION_STATUSES).meta({
            description: "Application status. Interviews are reported as shortlisted.",
            example: "submitted",
          }),
          matchScore: z.number().int().nullable().meta({
            description: "Match score from 0 to 100, or null if not scored.",
            example: 82,
          }),
          band: z.enum(APPLICATION_BANDS).nullable().meta({
            description: "Match band, or null if not scored.",
            example: "strong",
          }),
          createdAt: z.string().datetime().meta({
            description: "Timestamp the application was submitted.",
            example: "2026-10-06T09:30:00.000Z",
          }),
        }),
      )
      .meta({ description: "The applicant's four most recent applications." }),
    bestMatches: z
      .array(
        z.object({
          id: openListingIdSchema,
          title: z.string().meta({
            description: "Listing title.",
            example: "Senior Frontend Engineer",
          }),
          companyName: z.string().meta({ description: "Company name.", example: "Acme Corp" }),
          location: z.string().meta({ description: "Where the role is based.", example: "Manila" }),
          match: matchSummarySchema,
        }),
      )
      .meta({
        description:
          "Up to three open listings the applicant has not applied to, best match first. Empty unless the resume is ready.",
      }),
  })
  .meta({ id: "ApplicantDashboard", description: "Summary figures for the applicant dashboard." });

export type ApplicantDashboardResponse = z.infer<typeof applicantDashboardResponseSchema>;
