import { z } from "zod";

import { EMPLOYMENT_TYPES, JOB_STATUSES } from "@/types/jobs";

export const ADMIN_LISTING_PAGE_SIZE = 20;
export const MAX_REMOVAL_REASON = 300;

export const adminListingIdSchema = z.string().uuid();

export const listAdminListingsQuerySchema = z.object({
  q: z.string().trim().max(80).optional().meta({
    description: "Case-insensitive text to match against title and company name.",
    example: "frontend",
  }),
  status: z.enum(JOB_STATUSES).optional().meta({
    description: "Only return listings with this status.",
    example: "open",
  }),
  noApplications: z.stringbool().optional().meta({
    description: "When true, only open listings with no applications.",
    example: true,
  }),
  preparing: z.stringbool().optional().meta({
    description: "When true, only listings that are not match-ready yet.",
    example: true,
  }),
  page: z.coerce
    .number()
    .int()
    .min(1)
    .max(1000)
    .default(1)
    .meta({
      description: `Page number, from 1 to 1000. Page size is fixed at ${ADMIN_LISTING_PAGE_SIZE}.`,
      example: 1,
    }),
});

export type ListAdminListingsQuery = z.infer<typeof listAdminListingsQuerySchema>;

export const removeListingSchema = z.object({
  reason: z
    .string()
    .trim()
    .max(MAX_REMOVAL_REASON)
    .optional()
    .meta({
      description: `Optional reason shown to the recruiter. At most ${MAX_REMOVAL_REASON} characters; blank is treated as no reason.`,
      example: "This listing breaks our posting rules.",
    }),
});

export type RemoveListingInput = z.infer<typeof removeListingSchema>;

export const adminListingResponseSchema = z
  .object({
    id: z.string().uuid().meta({
      description: "Listing ID.",
      example: "7c1f2b0a-5d4e-4a63-9b8c-1e2d3f4a5b6c",
    }),
    title: z.string().meta({ description: "Listing title.", example: "Frontend Engineer" }),
    companyName: z.string().meta({ description: "Company name.", example: "Acme Recruitment" }),
    recruiterName: z.string().meta({
      description: "Recruiter display name, or email when no name is set.",
      example: "Jordan Reyes",
    }),
    location: z.string().meta({ description: "Listing location.", example: "Manila" }),
    employmentType: z.enum(EMPLOYMENT_TYPES).meta({
      description: "Employment type.",
      example: "full_time",
    }),
    status: z.enum(JOB_STATUSES).meta({ description: "Listing status.", example: "open" }),
    matchReady: z.boolean().meta({
      description: "False while the listing is still preparing and has no match scores.",
      example: true,
    }),
    hidden: z.boolean().meta({
      description: "True for an open listing whose recruiter account is not active.",
      example: false,
    }),
    salaryMin: z.number().int().nullable().meta({ description: "Minimum pay.", example: 40000 }),
    salaryMax: z.number().int().nullable().meta({ description: "Maximum pay.", example: 60000 }),
    removalReason: z.string().nullable().meta({
      description: "Reason given when an administrator removed the listing.",
      example: "This listing breaks our posting rules.",
    }),
    applicationCount: z.number().int().min(0).meta({
      description: "Applications submitted to the listing.",
      example: 12,
    }),
    createdAt: z.string().datetime().meta({
      description: "Timestamp the listing was created.",
      example: "2026-01-01T00:00:00.000Z",
    }),
  })
  .meta({ id: "AdminListing", description: "A listing as seen by an administrator." });

export type AdminListingResponse = z.infer<typeof adminListingResponseSchema>;

export const adminListingListResponseSchema = z
  .object({
    items: z.array(adminListingResponseSchema).meta({ description: "Listings on this page." }),
    total: z
      .number()
      .int()
      .min(0)
      .meta({ description: "Listings matching the filters.", example: 42 }),
    page: z.number().int().min(1).meta({ description: "Current page.", example: 1 }),
    pageSize: z.number().int().meta({
      description: "Listings per page.",
      example: ADMIN_LISTING_PAGE_SIZE,
    }),
    counts: z
      .object({
        all: z.number().int().min(0).meta({ example: 42 }),
        open: z.number().int().min(0).meta({ example: 30 }),
        closed: z.number().int().min(0).meta({ example: 10 }),
        removed: z.number().int().min(0).meta({ example: 2 }),
      })
      .meta({
        description:
          "Tab counts for the same q search, ignoring the status, noApplications and preparing filters.",
      }),
  })
  .meta({ id: "AdminListingList", description: "A page of listings." });

export type AdminListingListResponse = z.infer<typeof adminListingListResponseSchema>;

export const adminListingDetailResponseSchema = adminListingResponseSchema
  .extend({
    description: z.string().meta({
      description: "Listing description.",
      example: "Build and ship the candidate-facing web app.",
    }),
    skills: z.array(z.string()).meta({
      description: "Names of the skills the listing requests.",
      example: ["react", "typescript"],
    }),
  })
  .meta({
    id: "AdminListingDetail",
    description: "A listing for the admin drawer. Application count only, never applicant data.",
  });

export type AdminListingDetailResponse = z.infer<typeof adminListingDetailResponseSchema>;

export const adminListingResultResponseSchema = z
  .object({
    id: z.string().uuid().meta({
      description: "Listing ID.",
      example: "7c1f2b0a-5d4e-4a63-9b8c-1e2d3f4a5b6c",
    }),
    status: z.enum(JOB_STATUSES).meta({
      description: "Listing status after the change.",
      example: "removed",
    }),
  })
  .meta({ id: "AdminListingResult", description: "The listing that was moderated." });

export type AdminListingResultResponse = z.infer<typeof adminListingResultResponseSchema>;
