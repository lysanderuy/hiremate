import type { MatchBand } from "@/validators/application.validator";

import model from "./model.json";

export type MatchResult = {
  score: number;
  band: MatchBand;
  matched: string[];
  missing: string[];
};

export function bandFromScore(score: number): MatchBand {
  if (score >= model.bandCutoffs.strong) return "strong";
  if (score >= model.bandCutoffs.fair) return "fair";
  return "weak";
}

export function scoreMatch(resumeSkills: string[], jobSkills: string[]): MatchResult | null {
  if (jobSkills.length === 0) return null;

  const have = new Set(resumeSkills);
  const matched = jobSkills.filter((skill) => have.has(skill));
  const missing = jobSkills.filter((skill) => !have.has(skill));
  const score = Math.round((100 * matched.length) / jobSkills.length);

  return { score, band: bandFromScore(score), matched, missing };
}
