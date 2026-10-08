import { describe, expect, it } from "vitest";

import { updateProfileSchema } from "./profile.validator";

describe("updateProfileSchema", () => {
  it("accepts a valid display name", () => {
    const result = updateProfileSchema.safeParse({ displayName: "Jane Doe" });
    expect(result.success).toBe(true);
  });

  it("accepts an omitted display name", () => {
    const result = updateProfileSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects an empty display name", () => {
    const result = updateProfileSchema.safeParse({ displayName: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a single-character display name", () => {
    const result = updateProfileSchema.safeParse({ displayName: "a" });
    expect(result.success).toBe(false);
  });

  it("rejects a whitespace-only display name", () => {
    const result = updateProfileSchema.safeParse({ displayName: "   " });
    expect(result.success).toBe(false);
  });

  it("trims the display name", () => {
    const result = updateProfileSchema.safeParse({ displayName: "  Jane Doe  " });
    expect(result.success && result.data.displayName).toBe("Jane Doe");
  });

  it("accepts an 80-character display name", () => {
    const result = updateProfileSchema.safeParse({ displayName: "a".repeat(80) });
    expect(result.success).toBe(true);
  });

  it("rejects a display name over 80 characters", () => {
    const result = updateProfileSchema.safeParse({ displayName: "a".repeat(81) });
    expect(result.success).toBe(false);
  });
});
