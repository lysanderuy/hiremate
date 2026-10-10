import { describe, expect, it } from "vitest";

import { PdfUnreadableError, extractPdfText } from "./extract-pdf-text";
import { isPdfBytes, normalizeResumeText } from "./pdf-text";

function buildPdf(text: string): Uint8Array {
  const stream = `BT /F1 12 Tf 72 720 Td (${text}) Tj ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let body = "%PDF-1.4\n";
  const offsets = objects.map((object, index) => {
    const offset = body.length;
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
    return offset;
  });
  const xref = body.length;
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) body += `${String(offset).padStart(10, "0")} 00000 n \n`;
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new TextEncoder().encode(body);
}

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
