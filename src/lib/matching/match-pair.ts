import type { MatchStatus, MatchSummary } from "@/validators/open-listing.validator";

import { scorePair } from "./predict";

export type SkillsComparison = { matched: string[]; missing: string[] };

export type MatchPairResume = { skills: string[]; embedding: number[] | null };
export type MatchPairJob = {
  skills: string[];
  embedding: number[] | null;
  matchReady?: boolean;
};

export type MatchPairResult = {
  match: MatchSummary | null;
  skillsMatch: SkillsComparison | null;
  status: MatchStatus;
};

function isUsable(embedding: number[] | null): embedding is number[] {
  return (
    embedding !== null && embedding.length > 0 && embedding.every((value) => Number.isFinite(value))
  );
}

function compareSkills(resumeSkills: string[], jobSkills: string[]): SkillsComparison | null {
  if (jobSkills.length === 0) return null;
  const have = new Set(resumeSkills);
  const unique = [...new Set(jobSkills)];
  return {
    matched: unique.filter((skill) => have.has(skill)),
    missing: unique.filter((skill) => !have.has(skill)),
  };
}

export function matchPair(resume: MatchPairResume | null, job: MatchPairJob): MatchPairResult {
  if (!resume) return { match: null, skillsMatch: null, status: "no_resume" };

  const skillsMatch = compareSkills(resume.skills, job.skills);

  if (!isUsable(resume.embedding)) {
    return { match: null, skillsMatch, status: "resume_not_ready" };
  }
  if (job.matchReady === false || !isUsable(job.embedding)) {
    return { match: null, skillsMatch, status: "listing_not_ready" };
  }
  if (job.embedding.length !== resume.embedding.length) {
    return { match: null, skillsMatch, status: "model_mismatch" };
  }

  const { score, band, matched, missing, breakdown } = scorePair({
    resumeSkills: resume.skills,
    jobSkills: job.skills,
    resumeEmbedding: resume.embedding,
    jobEmbedding: job.embedding,
  });
  return { match: { score, band, matched, missing, breakdown }, skillsMatch, status: "ok" };
}
