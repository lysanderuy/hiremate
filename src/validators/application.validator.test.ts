import { describe, expect, it } from "vitest";

import {
  applicationIdSchema,
  applyToListingSchema,
  listApplicationsQuerySchema,
  listMyApplicationsQuerySchema,
  updateApplicationStatusSchema,
} from "./application.validator";

describe("applicationIdSchema", () => {
  it("accepts a uuid and rejects other strings", () => {
    expect(applicationIdSchema.safeParse("2f6a9c1e-8b34-4d57-a1c0-5e7b3d9f2a14").success).toBe(
      true,
    );
    expect(applicationIdSchema.safeParse("nope").success).toBe(false);
  });
});

describe("listApplicationsQuerySchema", () => {
  it("defaults sort to match", () => {
    const result = listApplicationsQuerySchema.safeParse({});
    expect(result.success && result.data.sort).toBe("match");
  });

  it("trims search", () => {
    const result = listApplicationsQuerySchema.safeParse({ search: "  maria  " });
    expect(result.success && result.data.search).toBe("maria");
  });

  it("trims a whitespace-only search to an empty string", () => {
    const result = listApplicationsQuerySchema.safeParse({ search: "   " });
    expect(result.success && result.data.search).toBe("");
  });

  it("rejects search over 80 characters", () => {
    expect(listApplicationsQuerySchema.safeParse({ search: "a".repeat(81) }).success).toBe(false);
  });

  it("accepts every status and rejects unknown ones", () => {
    expect(listApplicationsQuerySchema.safeParse({ status: "withdrawn" }).success).toBe(true);
    expect(listApplicationsQuerySchema.safeParse({ status: "hired" }).success).toBe(false);
  });

  it("rejects an unknown sort", () => {
    expect(listApplicationsQuerySchema.safeParse({ sort: "oldest" }).success).toBe(false);
  });

  it("accepts every sort", () => {
    for (const sort of ["match", "newest", "name"]) {
      expect(listApplicationsQuerySchema.safeParse({ sort }).success).toBe(true);
    }
  });

  it("accepts every band and rejects unknown ones", () => {
    for (const band of ["strong", "fair", "weak"]) {
      expect(listApplicationsQuerySchema.safeParse({ band }).success).toBe(true);
    }
    expect(listApplicationsQuerySchema.safeParse({ band: "great" }).success).toBe(false);
  });
});

describe("updateApplicationStatusSchema", () => {
  it.each(["viewed", "shortlisted", "interview", "rejected"])("accepts %s", (status) => {
    expect(updateApplicationStatusSchema.safeParse({ status }).success).toBe(true);
  });

  it.each(["submitted", "withdrawn", "hired"])("rejects %s", (status) => {
    expect(updateApplicationStatusSchema.safeParse({ status }).success).toBe(false);
  });

  it("requires a status", () => {
    expect(updateApplicationStatusSchema.safeParse({}).success).toBe(false);
  });
});

describe("listMyApplicationsQuerySchema", () => {
  it("accepts applicant-facing statuses", () => {
    for (const status of ["submitted", "viewed", "shortlisted", "rejected", "withdrawn"]) {
      expect(listMyApplicationsQuerySchema.safeParse({ status }).success).toBe(true);
    }
  });

  it("rejects interview, which is internal", () => {
    expect(listMyApplicationsQuerySchema.safeParse({ status: "interview" }).success).toBe(false);
  });

  it("allows no status", () => {
    expect(listMyApplicationsQuerySchema.safeParse({}).success).toBe(true);
  });
});

describe("applyToListingSchema", () => {
  it("requires a uuid listingId", () => {
    expect(
      applyToListingSchema.safeParse({ listingId: "7c1f2b0a-5d4e-4a63-9b8c-1e2d3f4a5b6c" }).success,
    ).toBe(true);
    expect(applyToListingSchema.safeParse({ listingId: "nope" }).success).toBe(false);
    expect(applyToListingSchema.safeParse({}).success).toBe(false);
  });
});
