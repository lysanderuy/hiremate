import { describe, expect, it } from "vitest";

import { HttpError } from "@/lib/api/errors";

import { PDF_MAX_BYTES, PDF_SIZE_ERROR, PDF_TYPE_ERROR } from "./client-file";
import { readResumePdf } from "./read-resume-pdf";
import { buildPdf } from "./test-pdf";

const UNREADABLE_MESSAGE = "We could not read text from this file. Upload a text-based PDF.";

function pdfFile(bytes: Uint8Array, name = "resume.pdf"): File {
  return new File([bytes.slice()], name, { type: "application/pdf" });
}

async function rejection(promise: Promise<unknown>): Promise<HttpError> {
  const error = await promise.then(
    () => null,
    (caught: unknown) => caught,
  );
  expect(error).toBeInstanceOf(HttpError);
  return error as HttpError;
}

describe("readResumePdf", () => {
  it("returns normalised text, the original bytes and file name for a valid text PDF", async () => {
    const body = "Experienced engineer with TypeScript and React. ".repeat(6);
    const pdf = buildPdf(body);
    const { text, bytes, fileName } = await readResumePdf(pdfFile(pdf, "My CV.pdf"));
    expect(text).toContain("Experienced engineer with TypeScript and React.");
    expect(bytes).toEqual(pdf);
    expect(fileName).toBe("My CV.pdf");
  });

  it("rejects a file over the size limit", async () => {
    const error = await rejection(readResumePdf(pdfFile(new Uint8Array(PDF_MAX_BYTES + 1))));
    expect(error.message).toBe(PDF_SIZE_ERROR);
    expect(error.status).toBe(413);
  });

  it("rejects a file without a .pdf extension", async () => {
    const error = await rejection(readResumePdf(pdfFile(buildPdf("hello"), "resume.txt")));
    expect(error.message).toBe(PDF_TYPE_ERROR);
  });

  it("rejects a .pdf file without PDF magic bytes", async () => {
    const bytes = new TextEncoder().encode("not a pdf at all");
    const error = await rejection(readResumePdf(pdfFile(bytes)));
    expect(error.message).toBe(PDF_TYPE_ERROR);
  });

  it("rejects a PDF the parser cannot read", async () => {
    const bytes = new TextEncoder().encode("%PDF-1.4 garbage");
    const error = await rejection(readResumePdf(pdfFile(bytes)));
    expect(error.message).toBe(UNREADABLE_MESSAGE);
  });

  it("rejects a PDF with too little text", async () => {
    const error = await rejection(readResumePdf(pdfFile(buildPdf("Too short"))));
    expect(error.message).toBe(UNREADABLE_MESSAGE);
  });

  it("rejects a PDF with too much text", async () => {
    const error = await rejection(readResumePdf(pdfFile(buildPdf("a".repeat(200_001)))));
    expect(error.message).toBe("This resume is too long.");
  });
});
