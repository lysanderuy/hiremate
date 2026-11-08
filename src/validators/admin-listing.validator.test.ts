import { describe, expect, it } from "vitest";

import {
  adminListingIdSchema,
  listAdminListingsQuerySchema,
  removeListingSchema,
} from "./admin-listing.validator";

describe("adminListingIdSchema", () => {
  it("accepts a uuid and rejects anything else", () => {
    expect(adminListingIdSchema.safeParse("7c1f2b0a-5d4e-4a63-9b8c-1e2d3f4a5b6c").success).toBe(
      true,
    );
    expect(adminListingIdSchema.safeParse("nope").success).toBe(false);
  });
});

describe("listAdminListingsQuerySchema", () => {
  it("defaults to page 1 with no filters", () => {
    expect(listAdminListingsQuerySchema.parse({})).toEqual({ page: 1 });
  });

  it("trims q and coerces page", () => {
    const result = listAdminListingsQuerySchema.parse({ q: "  dev  ", page: "2" });
    expect(result.q).toBe("dev");
    expect(result.page).toBe(2);
  });

  it("parses noApplications and preparing from query strings", () => {
    const result = listAdminListingsQuerySchema.parse({
      noApplications: "true",
      preparing: "false",
    });
    expect(result.noApplications).toBe(true);
    expect(result.preparing).toBe(false);
    expect(listAdminListingsQuerySchema.safeParse({ preparing: "maybe" }).success).toBe(false);
  });

  it("rejects a q over 80 characters", () => {
    expect(listAdminListingsQuerySchema.safeParse({ q: "a".repeat(81) }).success).toBe(false);
  });

  it("accepts the three job statuses only", () => {
    for (const status of ["open", "closed", "removed"]) {
      expect(listAdminListingsQuerySchema.safeParse({ status }).success).toBe(true);
    }
    expect(listAdminListingsQuerySchema.safeParse({ status: "draft" }).success).toBe(false);
  });

  it("bounds page between 1 and 1000", () => {
    expect(listAdminListingsQuerySchema.safeParse({ page: "0" }).success).toBe(false);
    expect(listAdminListingsQuerySchema.safeParse({ page: "1000" }).success).toBe(true);
    expect(listAdminListingsQuerySchema.safeParse({ page: "1001" }).success).toBe(false);
  });
});

describe("removeListingSchema", () => {
  it("accepts a missing reason", () => {
    expect(removeListingSchema.safeParse({}).success).toBe(true);
  });

  it("trims the reason", () => {
    const result = removeListingSchema.safeParse({ reason: "  Spam  " });
    expect(result.success && result.data.reason).toBe("Spam");
  });

  it("turns a whitespace-only reason into an empty string", () => {
    const result = removeListingSchema.safeParse({ reason: "   " });
    expect(result.success && result.data.reason).toBe("");
  });

  it("accepts 300 characters and rejects 301", () => {
    expect(removeListingSchema.safeParse({ reason: "a".repeat(300) }).success).toBe(true);
    expect(removeListingSchema.safeParse({ reason: "a".repeat(301) }).success).toBe(false);
  });
});
