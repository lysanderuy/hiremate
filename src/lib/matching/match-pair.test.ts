import { describe, expect, it } from "vitest";

import { matchPair } from "./match-pair";

const unit = (...values: number[]) => {
  const norm = Math.hypot(...values);
  return values.map((value) => value / norm);
};

const resume = { skills: ["react", "sql", "node"], embedding: unit(1, 0.2, 0) };
const job = { skills: ["sql", "react", "docker"], embedding: unit(1, 0.1, 0.1), matchReady: true };

describe("matchPair", () => {
  it("scores a ready pair", () => {
    const result = matchPair(resume, job);
    expect(result.status).toBe("ok");
    expect(result.match).not.toBeNull();
    expect(result.match?.score).toBeGreaterThanOrEqual(0);
    expect(result.match?.score).toBeLessThanOrEqual(100);
    expect(result.match?.matched).toEqual(["sql", "react"]);
    expect(result.match?.missing).toEqual(["docker"]);
  });

  it("exposes a breakdown that sums to the score only when match is present", () => {
    const ok = matchPair(resume, job);
    const { start, skills, content } = ok.match?.breakdown ?? { start: 0, skills: 0, content: 0 };
    expect(start + skills + content).toBe(ok.match?.score);
    expect(matchPair(null, job).match).toBeNull();
    expect(matchPair(resume, { ...job, embedding: null }).match).toBeNull();
  });

  it("keeps listing order in skillsMatch", () => {
    expect(matchPair(resume, job).skillsMatch).toEqual({
      matched: ["sql", "react"],
      missing: ["docker"],
    });
  });

  it("reports no_resume with no comparison", () => {
    expect(matchPair(null, job)).toEqual({ match: null, skillsMatch: null, status: "no_resume" });
  });

  it("reports resume_not_ready when the resume has no embedding", () => {
    const result = matchPair({ ...resume, embedding: null }, job);
    expect(result.status).toBe("resume_not_ready");
    expect(result.match).toBeNull();
    expect(result.skillsMatch?.matched).toEqual(["sql", "react"]);
  });

  it("reports listing_not_ready when the listing has no embedding", () => {
    const result = matchPair(resume, { ...job, embedding: null });
    expect(result.status).toBe("listing_not_ready");
    expect(result.match).toBeNull();
    expect(result.skillsMatch).not.toBeNull();
  });

  it("reports listing_not_ready when matchReady is false", () => {
    expect(matchPair(resume, { ...job, matchReady: false }).status).toBe("listing_not_ready");
  });

  it("defaults matchReady to ready", () => {
    expect(matchPair(resume, { skills: job.skills, embedding: job.embedding }).status).toBe("ok");
  });

  it("scores a listing with no skills and returns null skillsMatch", () => {
    const result = matchPair(resume, { ...job, skills: [] });
    expect(result.status).toBe("ok");
    expect(result.match).not.toBeNull();
    expect(result.skillsMatch).toBeNull();
  });

  it("reports model_mismatch when embedding dimensions differ", () => {
    const result = matchPair(resume, { ...job, embedding: [1, 0] });
    expect(result.status).toBe("model_mismatch");
    expect(result.match).toBeNull();
  });

  it("treats non-finite embeddings as not ready", () => {
    expect(matchPair({ ...resume, embedding: [NaN, 0, 0] }, job).status).toBe("resume_not_ready");
    expect(matchPair(resume, { ...job, embedding: [Infinity, 0, 0] }).status).toBe(
      "listing_not_ready",
    );
  });
});
