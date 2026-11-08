import { describe, expect, it } from "vitest";

import { approvalIdSchema, rejectRecruiterSchema } from "./approval.validator";

describe("approvalIdSchema", () => {
  it("accepts a uuid and rejects anything else", () => {
    expect(approvalIdSchema.safeParse("9d2c4f6a-1b3e-4a85-8c07-6e5d4c3b2a19").success).toBe(true);
    expect(approvalIdSchema.safeParse("not-a-uuid").success).toBe(false);
  });
});

describe("rejectRecruiterSchema", () => {
  it("accepts a missing reason", () => {
    expect(rejectRecruiterSchema.safeParse({}).success).toBe(true);
  });

  it("trims the reason", () => {
    const result = rejectRecruiterSchema.safeParse({ reason: "  No company  " });
    expect(result.success && result.data.reason).toBe("No company");
  });

  it("turns a whitespace-only reason into an empty string", () => {
    const result = rejectRecruiterSchema.safeParse({ reason: "   " });
    expect(result.success && result.data.reason).toBe("");
  });

  it("accepts 300 characters and rejects 301", () => {
    expect(rejectRecruiterSchema.safeParse({ reason: "a".repeat(300) }).success).toBe(true);
    expect(rejectRecruiterSchema.safeParse({ reason: "a".repeat(301) }).success).toBe(false);
  });
});
