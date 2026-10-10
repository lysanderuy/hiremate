import { describe, expect, it } from "vitest";

import { saveResumeSchema } from "./resume.validator";

const TEXT = "a".repeat(200);

describe("saveResumeSchema", () => {
  it("defaults source to pasted", () => {
    const result = saveResumeSchema.safeParse({ text: TEXT });
    expect(result.success && result.data.source).toBe("pasted");
  });

  it("accepts every source and rejects unknown ones", () => {
    for (const source of ["pasted", "text_file", "pdf"]) {
      expect(saveResumeSchema.safeParse({ text: TEXT, source }).success).toBe(true);
    }
    expect(saveResumeSchema.safeParse({ text: TEXT, source: "docx" }).success).toBe(false);
  });

  it("trims the text before checking its length", () => {
    expect(saveResumeSchema.safeParse({ text: `  ${"a".repeat(199)}  ` }).success).toBe(false);
    const result = saveResumeSchema.safeParse({ text: `  ${TEXT}  ` });
    expect(result.success && result.data.text).toBe(TEXT);
  });

  it("enforces the length bounds", () => {
    expect(saveResumeSchema.safeParse({ text: "a".repeat(200_000) }).success).toBe(true);
    expect(saveResumeSchema.safeParse({ text: "a".repeat(200_001) }).success).toBe(false);
  });

  it("requires text", () => {
    expect(saveResumeSchema.safeParse({}).success).toBe(false);
  });
});
