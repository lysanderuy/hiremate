import { describe, expect, it } from "vitest";

import { createListingSchema, updateListingSchema } from "./listing.validator";

const SALARY_MESSAGE = "Enter both amounts, with the minimum at or below the maximum.";
const skillId = "0b7d3f1e-6a52-4c8a-8d0e-3f2a9c1b4e77";
const otherSkillId = "1b7d3f1e-6a52-4c8a-8d0e-3f2a9c1b4e78";
const thirdSkillId = "2b7d3f1e-6a52-4c8a-8d0e-3f2a9c1b4e79";
const MIN_SKILLS_MESSAGE = "Pick at least 3 skills.";

const valid = {
  title: "Senior Engineer",
  description: "x".repeat(50),
  location: "Remote",
  employmentType: "full_time",
  skillIds: [skillId, otherSkillId, thirdSkillId],
};

describe("createListingSchema", () => {
  it("accepts a minimal listing with three skills", () => {
    const result = createListingSchema.parse(valid);
    expect(result.skillIds).toHaveLength(3);
    expect(result.salaryMin).toBeUndefined();
  });

  it("requires at least 3 skills", () => {
    expect(createListingSchema.safeParse({ ...valid, skillIds: undefined }).success).toBe(false);
    for (const skillIds of [[], [skillId, otherSkillId]]) {
      const result = createListingSchema.safeParse({ ...valid, skillIds });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(MIN_SKILLS_MESSAGE);
        expect(result.error.issues[0].path).toEqual(["skillIds"]);
      }
    }
    expect(
      createListingSchema.safeParse({ ...valid, skillIds: [skillId, otherSkillId, thirdSkillId] })
        .success,
    ).toBe(true);
  });

  it("does not count a duplicate toward the minimum", () => {
    expect(
      createListingSchema.safeParse({ ...valid, skillIds: [skillId, otherSkillId, otherSkillId] })
        .success,
    ).toBe(false);
  });

  it("trims and enforces field limits", () => {
    expect(createListingSchema.safeParse({ ...valid, title: "  ab  " }).success).toBe(false);
    expect(createListingSchema.safeParse({ ...valid, description: "x".repeat(49) }).success).toBe(
      false,
    );
    expect(createListingSchema.safeParse({ ...valid, location: "a" }).success).toBe(false);
    expect(createListingSchema.safeParse({ ...valid, employmentType: "gig" }).success).toBe(false);
  });

  it("accepts a valid salary range", () => {
    expect(createListingSchema.safeParse({ ...valid, salaryMin: 1, salaryMax: 1 }).success).toBe(
      true,
    );
  });

  it("rejects half-specified or inverted salary with the shared message", () => {
    for (const salary of [{ salaryMin: 10 }, { salaryMax: 10 }, { salaryMin: 20, salaryMax: 10 }]) {
      const result = createListingSchema.safeParse({ ...valid, ...salary });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(SALARY_MESSAGE);
        expect(result.error.issues[0].path).toEqual(["salaryMin"]);
      }
    }
  });

  it("rejects out-of-range salary", () => {
    expect(createListingSchema.safeParse({ ...valid, salaryMin: -1, salaryMax: 5 }).success).toBe(
      false,
    );
    expect(
      createListingSchema.safeParse({ ...valid, salaryMin: 1, salaryMax: 10_000_001 }).success,
    ).toBe(false);
  });

  it("requires unique uuid skillIds, max 30", () => {
    expect(
      createListingSchema.safeParse({ ...valid, skillIds: [skillId, skillId, otherSkillId] })
        .success,
    ).toBe(false);
    expect(createListingSchema.safeParse({ ...valid, skillIds: ["nope"] }).success).toBe(false);
    const thirtyOne = Array.from(
      { length: 31 },
      (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
    );
    expect(createListingSchema.safeParse({ ...valid, skillIds: thirtyOne }).success).toBe(false);
    expect(
      createListingSchema.safeParse({ ...valid, skillIds: [skillId, otherSkillId, thirdSkillId] })
        .success,
    ).toBe(true);
  });
});

describe("updateListingSchema", () => {
  it("requires at least one field", () => {
    expect(updateListingSchema.safeParse({}).success).toBe(false);
    expect(updateListingSchema.safeParse({ title: undefined }).success).toBe(false);
    expect(updateListingSchema.safeParse({ title: "New title" }).success).toBe(true);
  });

  it("allows status open or closed only", () => {
    expect(updateListingSchema.safeParse({ status: "closed" }).success).toBe(true);
    expect(updateListingSchema.safeParse({ status: "removed" }).success).toBe(false);
  });

  it("allows clearing salary with both null", () => {
    expect(updateListingSchema.safeParse({ salaryMin: null, salaryMax: null }).success).toBe(true);
  });

  it("rejects half-specified, mixed-null or inverted salary", () => {
    for (const salary of [
      { salaryMin: 10 },
      { salaryMax: null },
      { salaryMin: null, salaryMax: 10 },
      { salaryMin: 20, salaryMax: 10 },
    ]) {
      const result = updateListingSchema.safeParse(salary);
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0].message).toBe(SALARY_MESSAGE);
    }
  });

  it("requires at least 3 skills when skillIds is provided", () => {
    const result = updateListingSchema.safeParse({ skillIds: [skillId, otherSkillId] });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toBe(MIN_SKILLS_MESSAGE);
    expect(updateListingSchema.safeParse({ skillIds: [] }).success).toBe(false);
    expect(
      updateListingSchema.safeParse({ skillIds: [skillId, otherSkillId, thirdSkillId] }).success,
    ).toBe(true);
  });

  it("accepts an update that omits skillIds", () => {
    expect(updateListingSchema.safeParse({ title: "New title" }).success).toBe(true);
  });

  it("applies the same field limits", () => {
    expect(updateListingSchema.safeParse({ title: "ab" }).success).toBe(false);
    expect(
      updateListingSchema.safeParse({ skillIds: [skillId, skillId, otherSkillId] }).success,
    ).toBe(false);
  });
});
