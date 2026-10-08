import { z } from "zod";

import { EMPLOYMENT_TYPES } from "@/types/jobs";

import { skillResponseSchema } from "./skill.validator";

const SALARY_MESSAGE = "Enter both amounts, with the minimum at or below the maximum.";
const MAX_SALARY = 10_000_000;

const titleSchema = z.string().trim().min(3).max(120).meta({
  description: "Listing title.",
  example: "Senior Frontend Engineer",
});

const descriptionSchema = z.string().trim().min(50).max(10000).meta({
  description: "Full listing description.",
  example:
    "We are looking for a frontend engineer to own our recruiter dashboard, working closely with design and the platform team.",
});

const locationSchema = z.string().trim().min(2).max(120).meta({
  description: "Where the role is based.",
  example: "Remote - Philippines",
});

const employmentTypeSchema = z.enum(EMPLOYMENT_TYPES).meta({
  description: "Employment type.",
  example: "full_time",
});

const salaryAmount = z.number().int().min(0).max(MAX_SALARY);

const salaryMinSchema = salaryAmount.meta({
  description: "Minimum salary. Must be sent together with salaryMax.",
  example: 40000,
});

const salaryMaxSchema = salaryAmount.meta({
  description: "Maximum salary. Must be sent together with salaryMin.",
  example: 60000,
});

const skillIdsSchema = z
  .array(z.string().uuid())
  .max(30)
  .refine((ids) => new Set(ids).size === ids.length, { message: "Skills must be unique." })
  .meta({
    description: "IDs of active skills required for the role.",
    example: ["0b7d3f1e-6a52-4c8a-8d0e-3f2a9c1b4e77"],
  });

const salaryIssue = { code: "custom" as const, message: SALARY_MESSAGE, path: ["salaryMin"] };

export const createListingSchema = z
  .object({
    title: titleSchema,
    description: descriptionSchema,
    location: locationSchema,
    employmentType: employmentTypeSchema,
    salaryMin: salaryMinSchema.optional(),
    salaryMax: salaryMaxSchema.optional(),
    skillIds: skillIdsSchema.default([]),
  })
  .superRefine((value, ctx) => {
    const { salaryMin, salaryMax } = value;
    if (salaryMin === undefined && salaryMax === undefined) return;
    if (salaryMin === undefined || salaryMax === undefined || salaryMin > salaryMax) {
      ctx.addIssue(salaryIssue);
    }
  });

export type CreateListingInput = z.infer<typeof createListingSchema>;

export const updateListingSchema = z
  .object({
    title: titleSchema.optional(),
    description: descriptionSchema.optional(),
    location: locationSchema.optional(),
    employmentType: employmentTypeSchema.optional(),
    salaryMin: salaryMinSchema.nullable().optional().meta({
      description: "Minimum salary, or null (together with salaryMax) to clear the range.",
      example: 40000,
    }),
    salaryMax: salaryMaxSchema.nullable().optional().meta({
      description: "Maximum salary, or null (together with salaryMin) to clear the range.",
      example: 60000,
    }),
    skillIds: skillIdsSchema.optional(),
    status: z.enum(["open", "closed"]).optional().meta({
      description: "Set to closed to stop accepting applications, or open to reopen.",
      example: "closed",
    }),
  })
  .superRefine((value, ctx) => {
    if (Object.values(value).every((field) => field === undefined)) {
      ctx.addIssue({ code: "custom", message: "At least one field is required.", path: [] });
    }

    const { salaryMin, salaryMax } = value;
    if (salaryMin === undefined && salaryMax === undefined) return;

    const bothNull = salaryMin === null && salaryMax === null;
    const bothNumbers =
      typeof salaryMin === "number" && typeof salaryMax === "number" && salaryMin <= salaryMax;
    if (!bothNull && !bothNumbers) ctx.addIssue(salaryIssue);
  });

export type UpdateListingInput = z.infer<typeof updateListingSchema>;

export const listingIdSchema = z.string().uuid();

export const listingResponseSchema = z
  .object({
    id: z.string().uuid().meta({
      description: "Listing ID.",
      example: "7c1f2b0a-5d4e-4a63-9b8c-1e2d3f4a5b6c",
    }),
    title: z.string().meta({ description: "Listing title.", example: "Senior Frontend Engineer" }),
    description: z
      .string()
      .meta({ description: "Full listing description.", example: "We are looking for..." }),
    location: z.string().meta({ description: "Where the role is based.", example: "Remote" }),
    employmentType: z.enum(EMPLOYMENT_TYPES).meta({
      description: "Employment type.",
      example: "full_time",
    }),
    salaryMin: z
      .number()
      .int()
      .nullable()
      .meta({ description: "Minimum salary, if disclosed.", example: 40000 }),
    salaryMax: z
      .number()
      .int()
      .nullable()
      .meta({ description: "Maximum salary, if disclosed.", example: 60000 }),
    status: z.enum(["open", "closed", "removed"]).meta({
      description: "Listing status. Removed listings were taken down by an administrator.",
      example: "open",
    }),
    removalReason: z.string().nullable().meta({
      description: "Reason given when an administrator removed the listing.",
      example: null,
    }),
    matchReady: z.boolean().meta({
      description: "Whether applicant matching has been prepared for the current content.",
      example: false,
    }),
    skills: z.array(skillResponseSchema).meta({ description: "Skills required for the role." }),
    applicantCount: z.number().int().meta({
      description: "Number of applications received.",
      example: 0,
    }),
    topMatchScore: z.number().int().nullable().meta({
      description: "Highest applicant match score from 0 to 100, or null if none is scored.",
      example: 88,
    }),
    createdAt: z.string().datetime().meta({
      description: "Timestamp the listing was created.",
      example: "2026-01-01T00:00:00.000Z",
    }),
    updatedAt: z.string().datetime().meta({
      description: "Timestamp the listing was last updated.",
      example: "2026-01-15T09:30:00.000Z",
    }),
  })
  .meta({ id: "Listing", description: "A recruiter job listing." });

export type ListingResponse = z.infer<typeof listingResponseSchema>;

export const listingIdResponseSchema = z.object({
  id: z.string().uuid().meta({
    description: "ID of the deleted listing.",
    example: "7c1f2b0a-5d4e-4a63-9b8c-1e2d3f4a5b6c",
  }),
});
