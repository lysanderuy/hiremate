export const RESUME_SOURCES = ["pdf"] as const;
export type ResumeSource = (typeof RESUME_SOURCES)[number];

export const RESUME_STATES = ["ready", "failed"] as const;
export type ResumeState = (typeof RESUME_STATES)[number];
