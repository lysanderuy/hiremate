import { describe, expect, it } from "vitest";

import { breakdownFor, predictRating, ratingToScore, type PairFeatures } from "./predict";

function breakdownOf(features: PairFeatures) {
  const score = ratingToScore(predictRating(features));
  return { score, ...breakdownFor(features, score) };
}

describe("breakdownFor", () => {
  it("matches the worked example within one point", () => {
    const result = breakdownOf({
      sbertCosine: 0.482,
      skillsOverlap: 1,
      matchedCount: 5,
      jobSkillCount: 5,
      resumeSkillCount: 31,
    });
    expect(result.score).toBe(63);
    expect(Math.abs(result.start - 25)).toBeLessThanOrEqual(1);
    expect(Math.abs(result.skills - 41)).toBeLessThanOrEqual(1);
    expect(Math.abs(result.content - -3)).toBeLessThanOrEqual(1);
  });

  it("always sums to the score, including clipped extremes and empty jobs", () => {
    const cosines = [-0.2, 0, 0.2, 0.5, 0.8, 1];
    const jobCounts = [0, 1, 5, 20, 60];
    const resumeCounts = [0, 3, 31, 120];
    let clippedLow = 0;
    let clippedHigh = 0;

    for (const sbertCosine of cosines) {
      for (const jobSkillCount of jobCounts) {
        for (const resumeSkillCount of resumeCounts) {
          for (const share of [0, 0.5, 1]) {
            const matchedCount = Math.min(Math.round(jobSkillCount * share), resumeSkillCount);
            const features: PairFeatures = {
              sbertCosine,
              skillsOverlap: jobSkillCount > 0 ? matchedCount / jobSkillCount : 0,
              matchedCount,
              jobSkillCount,
              resumeSkillCount,
            };
            const result = breakdownOf(features);
            expect(Number.isInteger(result.content)).toBe(true);
            expect(result.start + result.skills + result.content).toBe(result.score);
            const raw = predictRating(features);
            if (raw <= 0) clippedLow++;
            if (raw >= 4) clippedHigh++;
          }
        }
      }
    }

    expect(clippedLow).toBeGreaterThan(0);
    expect(clippedHigh).toBeGreaterThan(0);
  });
});
