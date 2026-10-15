import type { MatchBand } from "@/validators/application.validator";

import model from "./model.json";

export function bandFromScore(score: number): MatchBand {
  if (score >= model.bandCutoffs.strong) return "strong";
  if (score >= model.bandCutoffs.fair) return "fair";
  return "weak";
}
