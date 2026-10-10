import type { ResumeSource } from "@/types/resumes";
import { MAX_RESUME_LENGTH, MIN_RESUME_LENGTH } from "@/validators/resume.validator";

export const TEXT_FILE_MAX_BYTES = 200 * 1024;
export const PDF_MAX_BYTES = 4 * 1024 * 1024;

export const PDF_COMING_SOON_MESSAGE =
  "PDF upload is coming soon. Paste your text or upload a .txt file.";

export const RESUME_SOURCE_LABELS: Record<ResumeSource, string> = {
  pasted: "Pasted",
  text_file: "Text file",
  pdf: "PDF",
};

export type ResumeFileCheck =
  { ok: true; source: Extract<ResumeSource, "text_file" | "pdf"> } | { ok: false; error: string };

export function getFileExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot + 1).toLowerCase();
}

export function checkResumeFile(file: { name: string; size: number }): ResumeFileCheck {
  const extension = getFileExtension(file.name);

  if (extension === "txt") {
    return file.size > TEXT_FILE_MAX_BYTES
      ? { ok: false, error: "Text files can be up to 200 KB." }
      : { ok: true, source: "text_file" };
  }
  if (extension === "pdf") {
    return file.size > PDF_MAX_BYTES
      ? { ok: false, error: "PDF files can be up to 4 MB." }
      : { ok: true, source: "pdf" };
  }
  return { ok: false, error: "Upload a .txt or .pdf file." };
}

export function getResumeTextError(text: string): string | null {
  const length = text.trim().length;
  if (length === 0) return null;
  if (length < MIN_RESUME_LENGTH) return `A resume needs at least ${MIN_RESUME_LENGTH} characters.`;
  if (length > MAX_RESUME_LENGTH) return "This resume is too long.";
  return null;
}

export function isResumeTextValid(text: string): boolean {
  const length = text.trim().length;
  return length >= MIN_RESUME_LENGTH && length <= MAX_RESUME_LENGTH;
}

const RETURN_PATTERN = /^jobs\/[0-9a-f-]{36}$/;

export function parseResumeReturn(value: string | null): string | null {
  return value !== null && RETURN_PATTERN.test(value) ? value : null;
}
