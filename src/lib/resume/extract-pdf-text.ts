import { extractText, getDocumentProxy } from "unpdf";

export const MAX_PDF_PAGES = 30;

export class PdfUnreadableError extends Error {
  constructor() {
    super("PDF could not be read");
    this.name = "PdfUnreadableError";
  }
}

export async function extractPdfText(bytes: Uint8Array): Promise<string> {
  try {
    const pdf = await getDocumentProxy(bytes);
    if (pdf.numPages > MAX_PDF_PAGES) throw new PdfUnreadableError();
    const { text } = await extractText(pdf, { mergePages: true });
    return text;
  } catch {
    throw new PdfUnreadableError();
  }
}
