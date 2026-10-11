import { describe, expect, it } from "vitest";

import { PdfUnreadableError, extractPdfText } from "./extract-pdf-text";
import { isPdfBytes, normalizeResumeText } from "./pdf-text";
import { buildPdf } from "./test-pdf";

describe("isPdfBytes", () => {
  it("detects the PDF magic bytes", () => {
    expect(isPdfBytes(new TextEncoder().encode("%PDF-1.7 rest"))).toBe(true);
    expect(isPdfBytes(new TextEncoder().encode("hello"))).toBe(false);
    expect(isPdfBytes(new Uint8Array())).toBe(false);
  });
});

describe("normalizeResumeText", () => {
  it("normalises line endings and strips control characters", () => {
    expect(normalizeResumeText("a\r\nb\u0000c\rd\te")).toBe("a\nbc\nd e");
  });

  it("collapses spaces and excess blank lines, then trims", () => {
    expect(normalizeResumeText("  a    b \n\n\n\n\n c  ")).toBe("a b\n\nc");
  });

  it("returns an empty string for whitespace-only input", () => {
    expect(normalizeResumeText(" \n\t \r\n ")).toBe("");
    expect(normalizeResumeText("")).toBe("");
  });

  it("keeps non-ASCII text intact", () => {
    expect(normalizeResumeText("Jos\u00e9   Garc\u00eda")).toBe("Jos\u00e9 Garc\u00eda");
  });
});

describe("extractPdfText", () => {
  it("reads text from a small PDF", async () => {
    const text = await extractPdfText(buildPdf("Hello resume"));
    expect(text).toContain("Hello resume");
  });

  it("wraps parser failures in PdfUnreadableError", async () => {
    const garbage = new TextEncoder().encode("%PDF-1.4 garbage");
    await expect(extractPdfText(garbage)).rejects.toBeInstanceOf(PdfUnreadableError);
  });
});
