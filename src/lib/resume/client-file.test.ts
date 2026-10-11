import { describe, expect, it } from "vitest";

import {
  PDF_MAX_BYTES,
  PDF_SIZE_ERROR,
  PDF_TYPE_ERROR,
  checkPdfFile,
  checkUploadLength,
} from "./client-file";

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

describe("checkUploadLength", () => {
  it("accepts a declared length within the limit plus multipart overhead", () => {
    expect(checkUploadLength("1024")).toBeNull();
    expect(checkUploadLength(String(PDF_MAX_BYTES))).toBeNull();
  });

  it("returns 413 for a declared length over the limit", () => {
    expect(checkUploadLength(String(PDF_MAX_BYTES + 64 * 1024 + 1))).toBe(413);
  });

  it("returns 411 for a missing, empty, non-numeric or negative length", () => {
    expect(checkUploadLength(null)).toBe(411);
    expect(checkUploadLength("")).toBe(411);
    expect(checkUploadLength("abc")).toBe(411);
    expect(checkUploadLength("-1")).toBe(411);
  });
});
