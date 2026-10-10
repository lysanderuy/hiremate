import { describe, expect, it } from "vitest";

import { listOpenListingsQuerySchema } from "./open-listing.validator";

describe("listOpenListingsQuerySchema", () => {
  it("defaults sort to newest and page to 1", () => {
    const result = listOpenListingsQuerySchema.safeParse({});
    expect(result.success && result.data.sort).toBe("newest");
    expect(result.success && result.data.page).toBe(1);
  });

  it("trims q and location", () => {
    const result = listOpenListingsQuerySchema.safeParse({ q: "  react ", location: " Manila " });
    expect(result.success && result.data.q).toBe("react");
    expect(result.success && result.data.location).toBe("Manila");
  });

  it("rejects q and location over 80 characters", () => {
    expect(listOpenListingsQuerySchema.safeParse({ q: "a".repeat(81) }).success).toBe(false);
    expect(listOpenListingsQuerySchema.safeParse({ location: "a".repeat(81) }).success).toBe(false);
  });

  it("accepts every employment type and rejects unknown ones", () => {
    for (const type of ["full_time", "part_time", "contract", "internship"]) {
      expect(listOpenListingsQuerySchema.safeParse({ type }).success).toBe(true);
    }
    expect(listOpenListingsQuerySchema.safeParse({ type: "freelance" }).success).toBe(false);
  });

  it("coerces minPay and page from query strings", () => {
    const result = listOpenListingsQuerySchema.safeParse({ minPay: "30000", page: "3" });
    expect(result.success && result.data.minPay).toBe(30000);
    expect(result.success && result.data.page).toBe(3);
  });

  it("rejects a negative or fractional minPay", () => {
    expect(listOpenListingsQuerySchema.safeParse({ minPay: "-1" }).success).toBe(false);
    expect(listOpenListingsQuerySchema.safeParse({ minPay: "1.5" }).success).toBe(false);
  });

  it("rejects a page below 1 or above 1000", () => {
    expect(listOpenListingsQuerySchema.safeParse({ page: "0" }).success).toBe(false);
    expect(listOpenListingsQuerySchema.safeParse({ page: "1000" }).success).toBe(true);
    expect(listOpenListingsQuerySchema.safeParse({ page: "1001" }).success).toBe(false);
  });

  it("accepts both sorts and rejects unknown ones", () => {
    for (const sort of ["newest", "best_match"]) {
      expect(listOpenListingsQuerySchema.safeParse({ sort }).success).toBe(true);
    }
    expect(listOpenListingsQuerySchema.safeParse({ sort: "oldest" }).success).toBe(false);
  });
});
