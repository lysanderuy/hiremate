import { describe, expect, it } from "vitest";

import { updateCompanySchema } from "./company.validator";

describe("updateCompanySchema", () => {
  it("accepts and trims a valid name", () => {
    const result = updateCompanySchema.safeParse({ name: "  Acme  " });
    expect(result.success && result.data.name).toBe("Acme");
  });

  it("rejects a missing name", () => {
    expect(updateCompanySchema.safeParse({}).success).toBe(false);
  });

  it("rejects a name under 2 characters", () => {
    expect(updateCompanySchema.safeParse({ name: "A" }).success).toBe(false);
  });

  it("rejects a whitespace-only name", () => {
    expect(updateCompanySchema.safeParse({ name: "    " }).success).toBe(false);
  });

  it("accepts 120 characters and rejects 121", () => {
    expect(updateCompanySchema.safeParse({ name: "a".repeat(120) }).success).toBe(true);
    expect(updateCompanySchema.safeParse({ name: "a".repeat(121) }).success).toBe(false);
  });
});
