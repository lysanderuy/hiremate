import { z } from "zod";

import { APPLICANT_APPLICATION_STATUSES } from "@/types/applications";
import { EMPLOYMENT_TYPES } from "@/types/jobs";

import {
  APPLICATION_BANDS,
  applicationIdSchema,
  matchBreakdownSchema,
} from "./application.validator";

export const OPEN_LISTING_PAGE_SIZE = 10;
export const OPEN_LISTING_SORTS = ["newest", "best_match"] as const;
export const MATCH_STATUSES = [
  "ok",
  "no_resume",
  "resume_not_ready",
  "listing_not_ready",
  "model_mismatch",
] as const;
export type MatchStatus = (typeof MATCH_STATUSES)[number];

export const openListingIdSchema = z.string().uuid().meta({
  description: "Listing ID.",
  example: "7c1f2b0a-5d4e-4a63-9b8c-1e2d3f4a5b6c",
});

export const listOpenListingsQuerySchema = z.object({
  q: z.string().trim().max(80).optional().meta({
    description: "Case-insensitive text to match against title, company name and description.",
    example: "frontend",
  }),
  location: z.string().trim().max(80).optional().meta({
    description: "Case-insensitive text to match against the location.",
    example: "Manila",
  }),
  type: z.enum(EMPLOYMENT_TYPES).optional().meta({
    description: "Only return listings with this employment type.",
    example: "full_time",
  }),
  minPay: z.coerce.number().int().min(0).optional().meta({
    description:
      "Minimum monthly pay in PHP. Returns listings whose maximum salary is at least this; listings without a salary are excluded.",
    example: 40000,
  }),
  sort: z.enum(OPEN_LISTING_SORTS).default("newest").meta({
    description:
      "Order by posting date (newest first) or by match with the caller's resume. Best match ranks only the 500 newest listings.",
    example: "newest",
  }),
  page: z.coerce.number().int().min(1).max(1000).default(1).meta({
    description: "Page number, from 1 to 1000. Page size is fixed at 10.",
    example: 1,
  }),
});

export type ListOpenListingsQuery = z.infer<typeof listOpenListingsQuerySchema>;

export const matchSummarySchema = z
  .object({
    score: z.number().int().min(0).max(100).meta({
      description: "AI match score from 0 to 100.",
      example: 75,
    }),
    band: z.enum(APPLICATION_BANDS).meta({ description: "Match band.", example: "strong" }),
    matched: z.array(z.string()).meta({
      description: "Listing skills found in the resume.",
      example: ["react", "typescript"],
    }),
    missing: z.array(z.string()).meta({
      description: "Listing skills not found in the resume.",
      example: ["postgresql"],
    }),
    breakdown: matchBreakdownSchema,
  })
  .meta({
    id: "MatchSummary",
    description: "AI estimate of how well the caller's resume fits a listing.",
  });

export type MatchSummary = z.infer<typeof matchSummarySchema>;

export const skillsMatchSchema = z
  .object({
    matched: z.array(z.string()).meta({
      description: "Listing skills found in the resume.",
      example: ["react", "typescript"],
    }),
    missing: z.array(z.string()).meta({
      description: "Listing skills not found in the resume.",
      example: ["postgresql"],
    }),
  })
  .meta({
    id: "SkillsMatch",
    description: "Skills-only comparison between a resume and a listing.",
  });

export type SkillsMatch = z.infer<typeof skillsMatchSchema>;

const openListingShape = {
  id: openListingIdSchema,
  title: z.string().meta({ description: "Listing title.", example: "Senior Frontend Engineer" }),
  companyName: z.string().meta({ description: "Company name.", example: "Acme Corp" }),
  location: z.string().meta({ description: "Where the role is based.", example: "Manila" }),
  employmentType: z.enum(EMPLOYMENT_TYPES).meta({
    description: "Employment type.",
    example: "full_time",
  }),
  salaryMin: z.number().int().nullable().meta({
    description: "Minimum monthly salary in PHP, or null if not disclosed.",
    example: 40000,
  }),
  salaryMax: z.number().int().nullable().meta({
    description: "Maximum monthly salary in PHP, or null if not disclosed.",
    example: 60000,
  }),
  createdAt: z.string().datetime().meta({
    description: "Timestamp the listing was posted.",
    example: "2026-10-06T09:30:00.000Z",
  }),
  skills: z.array(z.string()).meta({
    description: "Skills required for the role.",
    example: ["react", "typescript"],
  }),
  match: matchSummarySchema.nullable().meta({
    description: "AI match with the caller's resume, or null when it cannot be computed.",
  }),
  skillsMatch: skillsMatchSchema.nullable().meta({
    description:
      "Skills-only comparison with the caller's resume, or null when there is no resume or the listing has no skills.",
  }),
  matchStatus: z.enum(MATCH_STATUSES).meta({
    description:
      "Why match is present or null: ok, no_resume, resume_not_ready, listing_not_ready or model_mismatch.",
    example: "ok",
  }),
  application: z
    .object({
      id: applicationIdSchema,
      status: z.enum(APPLICANT_APPLICATION_STATUSES).meta({
        description: "The caller's application status.",
        example: "submitted",
      }),
    })
    .nullable()
    .meta({ description: "The caller's application to this listing, or null." }),
};

export const openListingSummaryResponseSchema = z
  .object(openListingShape)
  .meta({ id: "OpenListingSummary", description: "An open listing as shown in the job board." });

export type OpenListingSummaryResponse = z.infer<typeof openListingSummaryResponseSchema>;

export const openListingDetailResponseSchema = z
  .object({
    ...openListingShape,
    description: z.string().meta({
      description: "Full listing description.",
      example: "We are looking for a frontend engineer to own our recruiter dashboard...",
    }),
  })
  .meta({ id: "OpenListingDetail", description: "A full open listing." });

export type OpenListingDetailResponse = z.infer<typeof openListingDetailResponseSchema>;

export const openListingListResponseSchema = z
  .object({
    items: z.array(openListingSummaryResponseSchema).meta({
      description: "Listings on this page.",
    }),
    total: z.number().int().min(0).meta({ description: "Total matching listings.", example: 42 }),
    page: z.number().int().min(1).meta({ description: "Current page.", example: 1 }),
    pageSize: z.number().int().min(1).meta({ description: "Listings per page.", example: 10 }),
  })
  .meta({ id: "OpenListingList", description: "A page of open listings." });

export type OpenListingListResponse = z.infer<typeof openListingListResponseSchema>;
