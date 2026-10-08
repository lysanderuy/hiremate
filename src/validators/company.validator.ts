import { z } from "zod";

export const updateCompanySchema = z.object({
  name: z.string().trim().min(2).max(120).meta({
    description: "Company name shown on listings.",
    example: "Acme Recruitment",
  }),
});

export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;

export const companyResponseSchema = z
  .object({
    id: z.string().uuid().meta({
      description: "Company ID.",
      example: "3a9e1c42-7b6d-4f08-a1d5-2c8e4b6f9d10",
    }),
    name: z.string().meta({ description: "Company name.", example: "Acme Recruitment" }),
    createdAt: z.string().datetime().meta({
      description: "Timestamp the company was created.",
      example: "2026-01-01T00:00:00.000Z",
    }),
  })
  .meta({ id: "Company", description: "A recruiter's company." });

export type CompanyResponse = z.infer<typeof companyResponseSchema>;
