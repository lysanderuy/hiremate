import { describe, expect, it } from "vitest";

import { createSkillMatcher, type SkillLexiconEntry } from "@/lib/skills/extract-skills";

import golden from "./__fixtures__/golden.json";
import model from "./model.json";
import {
  cosine,
  pairFeatures,
  predictRating,
  predictRawRating,
  ratingToScore,
  scorePair,
  type PairFeatures,
} from "./predict";
import { bandFromScore } from "./score";

type PythonFeatures = {
  sbert_cosine: number;
  skills_overlap: number;
  matched_count: number;
  job_skill_count: number;
  resume_skill_count: number;
};

type ExtractionCase = { text: string; expected: string[]; note?: string };

const EPSILON = 1e-9;

function toFeatures(py: PythonFeatures): PairFeatures {
  return {
    sbertCosine: py.sbert_cosine,
    skillsOverlap: py.skills_overlap,
    matchedCount: py.matched_count,
    jobSkillCount: py.job_skill_count,
    resumeSkillCount: py.resume_skill_count,
  };
}

function expectClose(actual: number, expected: number) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(
    EPSILON * Math.max(1, Math.abs(expected)),
  );
}

describe("model.json", () => {
  it("keeps the feature order predict.ts reads", () => {
    expect(model.features).toEqual([
      "sbert_cosine",
      "skills_overlap",
      "matched_count",
      "job_skill_count",
      "resume_skill_count",
    ]);
  });
});

describe("golden scoring cases", () => {
  it("covers the edge cases it is meant to", () => {
    const raws = golden.scoring.map((c) => c.expected.rawRating);
    expect(raws.some((r) => r < 0)).toBe(true);
    expect(raws.some((r) => r > model.relevanceMax)).toBe(true);
    expect(golden.scoring.some((c) => c.jobSkills.length === 0)).toBe(true);
    expect(golden.scoring.some((c) => c.resumeSkills.length === 0)).toBe(true);
  });

  it.each(golden.scoring.map((c, i) => [i, c] as const))("matches python for case %i", (_i, c) => {
    const result = scorePair({
      resumeSkills: c.resumeSkills,
      jobSkills: c.jobSkills,
      resumeEmbedding: c.resumeEmbedding,
      jobEmbedding: c.jobEmbedding,
    });
    const expected = c.expected;
    const expectedFeatures = toFeatures(expected.features);

    expectClose(cosine(c.resumeEmbedding, c.jobEmbedding), expected.cosine);
    expectClose(result.features.sbertCosine, expectedFeatures.sbertCosine);
    expectClose(result.features.skillsOverlap, expectedFeatures.skillsOverlap);
    expect(result.features.matchedCount).toBe(expectedFeatures.matchedCount);
    expect(result.features.jobSkillCount).toBe(expectedFeatures.jobSkillCount);
    expect(result.features.resumeSkillCount).toBe(expectedFeatures.resumeSkillCount);
    expectClose(predictRawRating(result.features), expected.rawRating);
    expectClose(result.rating, expected.rating);
    expect(result.score).toBe(expected.score);
    expect(result.band).toBe(expected.band);
    expect(result.matched).toEqual(expected.matched);
    expect(result.missing).toEqual(expected.missing);
  });
});

describe("golden feature-vector cases", () => {
  it.each(golden.features.map((c, i) => [i, c] as const))("matches python for case %i", (_i, c) => {
    const features = toFeatures(c.features);

    expectClose(predictRawRating(features), c.expected.rawRating);
    expectClose(predictRating(features), c.expected.rating);
    const score = ratingToScore(predictRating(features));
    expect(score).toBe(c.expected.score);
    expect(bandFromScore(score)).toBe(c.expected.band);
  });
});

describe("pairFeatures", () => {
  it("reports zero overlap for a job with no skills", () => {
    expect(pairFeatures(["react"], [], 0.5)).toEqual({
      sbertCosine: 0.5,
      skillsOverlap: 0,
      matchedCount: 0,
      jobSkillCount: 0,
      resumeSkillCount: 1,
    });
  });
});

describe("cosine", () => {
  it("rejects embeddings of different dimensions", () => {
    expect(() => cosine([1, 0], [1, 0, 0])).toThrow();
  });
});

describe("golden extraction cases", () => {
  const matcher = createSkillMatcher(golden.lexicon as SkillLexiconEntry[]);
  const sorted = (values: string[]) => [...values].sort();

  const groups: [string, ExtractionCase[]][] = [
    ["resume", golden.extraction.resumes],
    ["job", golden.extraction.jobs],
    ["handcrafted", golden.extraction.handcrafted],
  ];

  for (const [label, cases] of groups) {
    it.each(cases.map((c, i) => [i, c] as const))(
      `matches python for ${label} text %i`,
      (_i, c) => {
        expect(sorted(matcher(c.text))).toEqual(sorted(c.expected));
      },
    );
  }
});
