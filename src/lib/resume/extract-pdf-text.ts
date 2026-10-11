import { extractText, getDocumentProxy } from "unpdf";

export const MAX_PDF_PAGES = 30;
export const PDF_EXTRACT_TIMEOUT_MS = 10_000;

export class PdfUnreadableError extends Error {
  constructor() {
    super("PDF could not be read");
    this.name = "PdfUnreadableError";
  }
}

async function parseAndExtract(bytes: Uint8Array): Promise<string> {
  const pdf = await getDocumentProxy(bytes);
  if (pdf.numPages > MAX_PDF_PAGES) throw new PdfUnreadableError();
  const { text } = await extractText(pdf, { mergePages: true });
  return text;
}

export async function extractPdfText(bytes: Uint8Array): Promise<string> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new PdfUnreadableError()), PDF_EXTRACT_TIMEOUT_MS);
  });

  try {
    return await Promise.race([parseAndExtract(bytes), timeout]);
  } catch (error) {
    if (!(error instanceof PdfUnreadableError)) {
      console.error("[resume] pdf extraction failed", error);
    }
    throw new PdfUnreadableError();
  } finally {
    clearTimeout(timer);
  }
}
