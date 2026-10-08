import { z } from "zod";

export const listSkillsQuerySchema = z.object({
  q: z.string().max(40).optional().meta({
    description: "Case-insensitive text to search skill names for.",
    example: "java",
  }),
  limit: z.coerce.number().int().min(1).max(50).default(20).meta({
    description: "Maximum number of skills to return.",
    example: 20,
  }),
});

export type ListSkillsQuery = z.infer<typeof listSkillsQuerySchema>;

export const suggestSkillsSchema = z.object({
  title: z.string().max(120).meta({
    description: "Listing title to scan for skills. May be empty.",
    example: "Senior Frontend Engineer",
  }),
  description: z.string().max(10000).meta({
    description: "Listing description to scan for skills. May be empty.",
    example: "We use React, TypeScript and PostgreSQL every day.",
  }),
});

export type SuggestSkillsInput = z.infer<typeof suggestSkillsSchema>;

export const skillResponseSchema = z
  .object({
    id: z.string().uuid().meta({
      description: "Skill ID.",
      example: "0b7d3f1e-6a52-4c8a-8d0e-3f2a9c1b4e77",
    }),
    name: z.string().meta({ description: "Canonical lowercase skill name.", example: "react" }),
  })
  .meta({ id: "Skill", description: "A skill from the managed skills list." });

export type SkillResponse = z.infer<typeof skillResponseSchema>;
