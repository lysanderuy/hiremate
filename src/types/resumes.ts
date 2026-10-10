export const RESUME_SOURCES = ["pasted", "text_file", "pdf"] as const;
export type ResumeSource = (typeof RESUME_SOURCES)[number];

export const RESUME_STATES = ["processing", "ready", "failed"] as const;
export type ResumeState = (typeof RESUME_STATES)[number];
