import { z } from "zod";

export const MAX_REJECTION_REASON = 300;

export const approvalIdSchema = z.string().uuid();

export const rejectRecruiterSchema = z.object({
  reason: z
    .string()
    .trim()
    .max(MAX_REJECTION_REASON)
    .optional()
    .meta({
      description: `Optional reason shown to the recruiter. At most ${MAX_REJECTION_REASON} characters; blank is treated as no reason.`,
      example: "We could not verify your company.",
    }),
});

export type RejectRecruiterInput = z.infer<typeof rejectRecruiterSchema>;

export const pendingRecruiterResponseSchema = z
  .object({
    id: z.string().uuid().meta({
      description: "Recruiter profile ID.",
      example: "9d2c4f6a-1b3e-4a85-8c07-6e5d4c3b2a19",
    }),
    displayName: z.string().nullable().meta({
      description: "Recruiter display name, if set.",
      example: "Jordan Reyes",
    }),
    email: z.string().meta({ description: "Recruiter email.", example: "jordan@acme.test" }),
    jobTitle: z.string().nullable().meta({
      description: "Recruiter job title, if set.",
      example: "Talent Acquisition Lead",
    }),
    companyName: z.string().nullable().meta({
      description: "Company name, if the recruiter has added one.",
      example: "Acme Recruitment",
    }),
    createdAt: z.string().datetime().meta({
      description: "Timestamp the recruiter signed up.",
      example: "2026-01-01T00:00:00.000Z",
    }),
  })
  .meta({
    id: "PendingRecruiter",
    description: "A recruiter account waiting for administrator approval.",
  });

export type PendingRecruiterResponse = z.infer<typeof pendingRecruiterResponseSchema>;

export const approvalResultResponseSchema = z
  .object({
    id: z.string().uuid().meta({
      description: "Recruiter profile ID.",
      example: "9d2c4f6a-1b3e-4a85-8c07-6e5d4c3b2a19",
    }),
  })
  .meta({ id: "ApprovalResult", description: "The recruiter account that was reviewed." });

export type ApprovalResultResponse = z.infer<typeof approvalResultResponseSchema>;
