import type { MatchStatus } from "@/validators/open-listing.validator";

export const NO_SKILLS_NOTE = "This listing has no skills listed, so the score is less reliable.";

export const MATCH_STATUS_MESSAGES: Record<Exclude<MatchStatus, "ok">, string> = {
  no_resume: "Add a resume to see your match score.",
  resume_not_ready: "Your resume is not ready. Open My resume to try again.",
  listing_not_ready: "Match score is being prepared. Try again in a moment.",
  model_mismatch: "Match score is unavailable right now.",
};

export function matchStatusMessage(status: MatchStatus): string {
  return status === "ok" ? "No score is available right now." : MATCH_STATUS_MESSAGES[status];
}
