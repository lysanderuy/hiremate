import { describe, expect, it } from "vitest";

import { listSkillsQuerySchema, suggestSkillsSchema } from "./skill.validator";

describe("listSkillsQuerySchema", () => {
  it("defaults limit to 20 and coerces strings", () => {
    expect(listSkillsQuerySchema.parse({}).limit).toBe(20);
    expect(listSkillsQuerySchema.parse({ limit: "5" }).limit).toBe(5);
  });

  it("rejects out-of-range limits and long queries", () => {
    expect(listSkillsQuerySchema.safeParse({ limit: "0" }).success).toBe(false);
    expect(listSkillsQuerySchema.safeParse({ limit: "51" }).success).toBe(false);
    expect(listSkillsQuerySchema.safeParse({ q: "a".repeat(41) }).success).toBe(false);
  });
});

describe("suggestSkillsSchema", () => {
  it("accepts empty strings", () => {
    expect(suggestSkillsSchema.safeParse({ title: "", description: "" }).success).toBe(true);
  });

  it("enforces max lengths", () => {
    expect(suggestSkillsSchema.safeParse({ title: "a".repeat(121), description: "" }).success).toBe(
      false,
    );
    expect(
      suggestSkillsSchema.safeParse({ title: "", description: "a".repeat(10001) }).success,
    ).toBe(false);
  });
});
