import { describe, expect, it } from "vitest";

import {
  PDF_MAX_BYTES,
  TEXT_FILE_MAX_BYTES,
  checkResumeFile,
  getFileExtension,
  getResumeTextError,
  isResumeTextValid,
  parseResumeReturn,
} from "./client-file";

describe("getFileExtension", () => {
  it("lowercases the extension", () => {
    expect(getFileExtension("CV.TXT")).toBe("txt");
  });

  it("returns an empty string without an extension", () => {
    expect(getFileExtension("resume")).toBe("");
  });
});

describe("checkResumeFile", () => {
  it("accepts a small text file", () => {
    expect(checkResumeFile({ name: "cv.txt", size: 100 })).toEqual({
      ok: true,
      source: "text_file",
    });
  });

  it("rejects a text file over 200 KB", () => {
    expect(checkResumeFile({ name: "cv.txt", size: TEXT_FILE_MAX_BYTES + 1 })).toEqual({
      ok: false,
      error: "Text files can be up to 200 KB.",
    });
  });

  it("accepts a PDF within 4 MB and rejects one above", () => {
    expect(checkResumeFile({ name: "cv.pdf", size: PDF_MAX_BYTES })).toEqual({
      ok: true,
      source: "pdf",
    });
    expect(checkResumeFile({ name: "cv.pdf", size: PDF_MAX_BYTES + 1 })).toEqual({
      ok: false,
      error: "PDF files can be up to 4 MB.",
    });
  });

  it("rejects other extensions", () => {
    expect(checkResumeFile({ name: "cv.docx", size: 10 })).toEqual({
      ok: false,
      error: "Upload a .txt or .pdf file.",
    });
  });
});

describe("resume text validity", () => {
  it("reports no error for empty text", () => {
    expect(getResumeTextError("   ")).toBeNull();
  });

  it("reports too short and too long text", () => {
    expect(getResumeTextError("a".repeat(199))).toBe("A resume needs at least 200 characters.");
    expect(getResumeTextError("a".repeat(200_001))).toBe("This resume is too long.");
  });

  it("is valid only within the limits after trimming", () => {
    expect(isResumeTextValid(`  ${"a".repeat(199)}  `)).toBe(false);
    expect(isResumeTextValid("a".repeat(200))).toBe(true);
    expect(isResumeTextValid("a".repeat(200_000))).toBe(true);
    expect(isResumeTextValid("a".repeat(200_001))).toBe(false);
  });
});

describe("parseResumeReturn", () => {
  const id = "7c1f2b0a-5d4e-4a63-9b8c-1e2d3f4a5b6c";

  it("accepts a job path", () => {
    expect(parseResumeReturn(`jobs/${id}`)).toBe(`jobs/${id}`);
  });

  it("rejects anything else", () => {
    expect(parseResumeReturn(null)).toBeNull();
    expect(parseResumeReturn(`/jobs/${id}`)).toBeNull();
    expect(parseResumeReturn(`jobs/${id}/../../x`)).toBeNull();
    expect(parseResumeReturn("//evil.com")).toBeNull();
    expect(parseResumeReturn("https://evil.com")).toBeNull();
  });
});
