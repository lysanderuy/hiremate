import { describe, expect, it } from "vitest";

import { pdfResponse, sanitizePdfFileName } from "./pdf-response";

describe("sanitizePdfFileName", () => {
  it("keeps a normal name", () => {
    expect(sanitizePdfFileName("My CV.pdf")).toBe("My CV.pdf");
  });

  it("strips quotes, backslashes, path separators and control characters", () => {
    expect(sanitizePdfFileName('..\\a/"b"\r\nc.pdf')).toBe("..abc.pdf");
  });

  it("replaces non-ASCII characters", () => {
    expect(sanitizePdfFileName("résumé.pdf")).toBe("r_sum_.pdf");
  });

  it("appends .pdf when missing and falls back when empty", () => {
    expect(sanitizePdfFileName("cv")).toBe("cv.pdf");
    expect(sanitizePdfFileName('"/"')).toBe("resume.pdf");
  });
});

describe("pdfResponse", () => {
  it("sets the security headers and both filename forms", () => {
    const response = pdfResponse(Buffer.from("x"), "résumé.pdf");
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("Content-Disposition")).toBe(
      `inline; filename="r_sum_.pdf"; filename*=UTF-8''r%C3%A9sum%C3%A9.pdf`,
    );
  });
});
