import { describe, expect, it } from "vitest";

import { PDF_MAX_BYTES, PDF_SIZE_ERROR, PDF_TYPE_ERROR, checkPdfFile } from "./client-file";

describe("checkPdfFile", () => {
  it("accepts a PDF within the limit, regardless of extension case", () => {
    expect(checkPdfFile({ name: "CV.PDF", size: PDF_MAX_BYTES })).toBeNull();
  });

  it("rejects a PDF over the limit", () => {
    expect(checkPdfFile({ name: "cv.pdf", size: PDF_MAX_BYTES + 1 })).toBe(PDF_SIZE_ERROR);
  });

  it("rejects other file types", () => {
    expect(checkPdfFile({ name: "cv.txt", size: 10 })).toBe(PDF_TYPE_ERROR);
    expect(checkPdfFile({ name: "pdf", size: 10 })).toBe(PDF_TYPE_ERROR);
  });
});
