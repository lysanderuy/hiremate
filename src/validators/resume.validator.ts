import { z } from "zod";

import { RESUME_SOURCES, RESUME_STATES } from "@/types/resumes";

export const MIN_RESUME_LENGTH = 200;
export const MAX_RESUME_LENGTH = 200_000;

export const resumeSourceSchema = z.enum(RESUME_SOURCES).meta({
  description: "How the resume was provided.",
  example: "pdf",
});

export const resumeStateSchema = z.enum(RESUME_STATES).meta({
  description: "ready when skills and the match embedding were prepared, failed otherwise.",
  example: "ready",
});

export const resumeResponseSchema = z
  .object({
    id: z.string().uuid().meta({
      description: "Resume ID.",
      example: "4b1e7a52-93c0-4f1d-8a6e-2d5c9b7f3e10",
    }),
    source: resumeSourceSchema,
    state: resumeStateSchema,
    skills: z.array(z.string()).meta({
      description: "Skills found in the resume.",
      example: ["react", "typescript"],
    }),
    updatedAt: z.string().datetime().meta({
      description: "Timestamp the resume was last saved.",
      example: "2026-10-06T09:30:00.000Z",
    }),
  })
  .meta({ id: "Resume", description: "The applicant's resume." });

export type ResumeResponse = z.infer<typeof resumeResponseSchema>;
