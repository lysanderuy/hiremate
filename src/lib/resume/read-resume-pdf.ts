import { HttpError } from "@/lib/api/errors";
import { MAX_RESUME_LENGTH, MIN_RESUME_LENGTH } from "@/validators/resume.validator";

import { PDF_MAX_BYTES, PDF_SIZE_ERROR, PDF_TYPE_ERROR, hasPdfExtension } from "./client-file";
import { PdfUnreadableError, extractPdfText } from "./extract-pdf-text";
import { isPdfBytes, normalizeResumeText } from "./pdf-text";

const UNREADABLE_MESSAGE = "We could not read text from this file. Upload a text-based PDF.";

export async function readResumePdf(
  file: File,
): Promise<{ text: string; bytes: Uint8Array; fileName: string }> {
  if (file.size > PDF_MAX_BYTES) throw new HttpError(PDF_SIZE_ERROR, 413);
  if (!hasPdfExtension(file.name)) throw new HttpError(PDF_TYPE_ERROR, 422);

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!isPdfBytes(bytes)) throw new HttpError(PDF_TYPE_ERROR, 422);

  let raw: string;
  try {
    // The parser detaches its input buffer; pass a copy so the original bytes survive.
    raw = await extractPdfText(bytes.slice());
  } catch (error) {
    if (error instanceof PdfUnreadableError) throw new HttpError(UNREADABLE_MESSAGE, 422);
    throw error;
  }

  const text = normalizeResumeText(raw);
  if (text.length < MIN_RESUME_LENGTH) throw new HttpError(UNREADABLE_MESSAGE, 422);
  if (text.length > MAX_RESUME_LENGTH) throw new HttpError("This resume is too long.", 422);
  return { text, bytes, fileName: file.name };
}
