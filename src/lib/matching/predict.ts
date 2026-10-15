import type { MatchBand, MatchBreakdown } from "@/validators/application.validator";

import model from "./model.json";
import { bandFromScore } from "./score";

export const MODEL_VERSION: string = model.trainedAt;

export type PairFeatures = {
  sbertCosine: number;
  skillsOverlap: number;
  matchedCount: number;
  jobSkillCount: number;
  resumeSkillCount: number;
};

export type PairScore = {
  rating: number;
  score: number;
  band: MatchBand;
  matched: string[];
  missing: string[];
  features: PairFeatures;
  breakdown: MatchBreakdown;
};

export type ScorePairInput = {
  resumeSkills: string[];
  jobSkills: string[];
  resumeEmbedding: number[];
  jobEmbedding: number[];
};

// Both embeddings are length 1, so the dot product is the cosine.
export function cosine(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`Embedding dimensions differ: ${a.length} vs ${b.length}`);
  }
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i] * b[i];
  return sum;
}

export function pairFeatures(
  resumeSkills: string[],
  jobSkills: string[],
  cosineValue: number,
): PairFeatures {
  const resume = new Set(resumeSkills);
  const job = new Set(jobSkills);
  let matchedCount = 0;
  for (const skill of job) if (resume.has(skill)) matchedCount++;

  return {
    sbertCosine: cosineValue,
    skillsOverlap: job.size > 0 ? matchedCount / job.size : 0,
    matchedCount,
    jobSkillCount: job.size,
    resumeSkillCount: resume.size,
  };
}

function featureVector(features: PairFeatures): number[] {
  return [
    features.sbertCosine,
    features.skillsOverlap,
    features.matchedCount,
    features.jobSkillCount,
    features.resumeSkillCount,
  ];
}

export function predictRawRating(features: PairFeatures): number {
  const x = featureVector(features);
  let rating = model.intercept;
  for (let i = 0; i < x.length; i++) {
    rating += (model.coef[i] * (x[i] - model.mean[i])) / model.scale[i];
  }
  return rating;
}

export function predictRating(features: PairFeatures): number {
  return Math.min(Math.max(predictRawRating(features), 0), model.relevanceMax);
}

export function ratingToScore(rating: number): number {
  const clipped = Math.min(Math.max(rating, 0), model.relevanceMax);
  return Math.floor((clipped * 100) / model.relevanceMax + 0.5);
}

export function breakdownFor(features: PairFeatures, score: number): MatchBreakdown {
  const x = featureVector(features);
  const pointsPerRating = 100 / model.relevanceMax;
  const contribution = (i: number) =>
    ((model.coef[i] * (x[i] - model.mean[i])) / model.scale[i]) * pointsPerRating;

  const start = Math.round(model.intercept * pointsPerRating);
  const skills = Math.round(contribution(1) + contribution(2) + contribution(3) + contribution(4));
  return { start, skills, content: score - start - skills };
}

export function scorePair(input: ScorePairInput): PairScore {
  const features = pairFeatures(
    input.resumeSkills,
    input.jobSkills,
    cosine(input.resumeEmbedding, input.jobEmbedding),
  );
  const rating = predictRating(features);
  const score = ratingToScore(rating);

  const have = new Set(input.resumeSkills);
  const jobUnique = [...new Set(input.jobSkills)];

  return {
    rating,
    score,
    band: bandFromScore(score),
    matched: jobUnique.filter((skill) => have.has(skill)),
    missing: jobUnique.filter((skill) => !have.has(skill)),
    features,
    breakdown: breakdownFor(features, score),
  };
}
