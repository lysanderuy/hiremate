import type { ResumeSource } from "@/types/resumes";

export const PDF_MAX_BYTES = 4 * 1024 * 1024;

export const PDF_TYPE_ERROR = "Upload a PDF file.";
export const PDF_SIZE_ERROR = "PDF files can be up to 4 MB.";

export const RESUME_SOURCE_LABELS: Record<ResumeSource, string> = {
  pasted: "Pasted",
  text_file: "Text file",
  pdf: "PDF",
};

export function hasPdfExtension(fileName: string): boolean {
  return fileName.toLowerCase().endsWith(".pdf");
}

export function checkPdfFile(file: { name: string; size: number }): string | null {
  if (!hasPdfExtension(file.name)) return PDF_TYPE_ERROR;
  if (file.size > PDF_MAX_BYTES) return PDF_SIZE_ERROR;
  return null;
}
