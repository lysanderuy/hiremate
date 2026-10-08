import { z } from "zod";

import { APPLICATION_STATUSES } from "@/types/applications";

export const RECRUITER_SETTABLE_STATUSES = [
  "viewed",
  "shortlisted",
  "interview",
  "rejected",
] as const;

export const APPLICATION_SORTS = ["match", "newest", "name"] as const;
export const APPLICATION_BANDS = ["strong", "fair", "weak"] as const;
export type MatchBand = (typeof APPLICATION_BANDS)[number];

export const applicationIdSchema = z.string().uuid().meta({
  description: "Application ID.",
  example: "2f6a9c1e-8b34-4d57-a1c0-5e7b3d9f2a14",
});

export const listApplicationsQuerySchema = z.object({
  status: z.enum(APPLICATION_STATUSES).optional().meta({
    description: "Only return applications with this status.",
    example: "shortlisted",
  }),
  search: z.string().trim().max(80).optional().meta({
    description: "Case-insensitive text to match against the applicant's name.",
    example: "maria",
  }),
  band: z.enum(APPLICATION_BANDS).optional().meta({
    description: "Only return applications in this match band.",
    example: "strong",
  }),
  sort: z.enum(APPLICATION_SORTS).default("match").meta({
    description:
      "Order by match score (highest first), submission date (newest first) or applicant name (A to Z).",
    example: "match",
  }),
});

export type ListApplicationsQuery = z.infer<typeof listApplicationsQuerySchema>;

export const updateApplicationStatusSchema = z.object({
  status: z.enum(RECRUITER_SETTABLE_STATUSES).meta({
    description: "New status. Submitted and withdrawn cannot be set by a recruiter.",
    example: "shortlisted",
  }),
});

export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusSchema>;

const summaryShape = {
  id: applicationIdSchema,
  jobId: z.string().uuid().meta({
    description: "ID of the listing applied to.",
    example: "7c1f2b0a-5d4e-4a63-9b8c-1e2d3f4a5b6c",
  }),
  applicantName: z.string().nullable().meta({
    description: "Applicant display name, if they set one.",
    example: "Maria Santos",
  }),
  skillsMatched: z.array(z.string()).meta({
    description: "Listing skills found in the resume.",
    example: ["react", "typescript"],
  }),
  skillsMissing: z.array(z.string()).meta({
    description: "Listing skills not found in the resume.",
    example: ["postgresql"],
  }),
  status: z.enum(APPLICATION_STATUSES).meta({
    description: "Application status.",
    example: "submitted",
  }),
  createdAt: z.string().datetime().meta({
    description: "Timestamp the application was submitted.",
    example: "2026-01-01T00:00:00.000Z",
  }),
  statusChangedAt: z.string().datetime().meta({
    description: "Timestamp the status last changed.",
    example: "2026-01-02T08:00:00.000Z",
  }),
  matchScore: z.number().int().nullable().meta({
    description: "Match score from 0 to 100, or null if not scored.",
    example: 82,
  }),
  band: z.enum(APPLICATION_BANDS).nullable().meta({
    description: "Match band, or null if not scored.",
    example: "strong",
  }),
};

export const applicationSummaryResponseSchema = z
  .object(summaryShape)
  .meta({ id: "ApplicationSummary", description: "An application, as shown in a listing's list." });

export type ApplicationSummaryResponse = z.infer<typeof applicationSummaryResponseSchema>;

const countField = (description: string, example: number) =>
  z.number().int().min(0).meta({ description, example });

export const applicationListResponseSchema = z
  .object({
    items: z.array(applicationSummaryResponseSchema).meta({
      description: "Applications matching the filters.",
    }),
    counts: z
      .object({
        all: countField("Total across all statuses.", 24),
        submitted: countField("Applications with status submitted.", 10),
        viewed: countField("Applications with status viewed.", 6),
        shortlisted: countField("Applications with status shortlisted.", 4),
        interview: countField("Applications with status interview.", 2),
        rejected: countField("Applications with status rejected.", 1),
        withdrawn: countField("Applications with status withdrawn.", 1),
      })
      .meta({
        description: "Applications per status. Honours search and band, ignores the status filter.",
      }),
  })
  .meta({ id: "ApplicationList", description: "A page of applications with per-status counts." });

export type ApplicationListResponse = z.infer<typeof applicationListResponseSchema>;

export const applicationDetailResponseSchema = z
  .object({
    ...summaryShape,
    applicantEmail: z.string().meta({
      description: "Applicant email address.",
      example: "maria@example.com",
    }),
    resumeSnapshot: z.string().meta({
      description: "Resume text as it was when the application was submitted.",
      example: "Frontend engineer with five years of React experience...",
    }),
    viewedAt: z.string().datetime().nullable().meta({
      description: "Timestamp a recruiter first opened the application, or null.",
      example: "2026-01-02T08:00:00.000Z",
    }),
    jobTitle: z.string().meta({
      description: "Title of the listing applied to.",
      example: "Senior Frontend Engineer",
    }),
  })
  .meta({ id: "ApplicationDetail", description: "A full application for recruiter review." });

export type ApplicationDetailResponse = z.infer<typeof applicationDetailResponseSchema>;
