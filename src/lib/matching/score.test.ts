import { describe, expect, it } from "vitest";

import { bandFromScore, scoreMatch } from "./score";

describe("bandFromScore", () => {
  it.each([
    [100, "strong"],
    [70, "strong"],
    [69, "fair"],
    [40, "fair"],
    [39, "weak"],
    [0, "weak"],
  ])("maps %i to %s", (score, band) => {
    expect(bandFromScore(score)).toBe(band);
  });
});

describe("scoreMatch", () => {
  it("returns null when the listing has no skills", () => {
    expect(scoreMatch(["react"], [])).toBeNull();
  });

  it("splits matched and missing skills", () => {
    expect(scoreMatch(["react", "node"], ["react", "sql"])).toEqual({
      score: 50,
      band: "fair",
      matched: ["react"],
      missing: ["sql"],
    });
  });

  it("scores a full match as strong", () => {
    expect(scoreMatch(["a", "b", "c"], ["a", "b"])).toMatchObject({ score: 100, band: "strong" });
  });

  it("scores no overlap as weak", () => {
    expect(scoreMatch([], ["a", "b"])).toMatchObject({ score: 0, band: "weak", matched: [] });
  });

  it("rounds to the nearest integer", () => {
    expect(scoreMatch(["a"], ["a", "b", "c"])?.score).toBe(33);
    expect(scoreMatch(["a", "b"], ["a", "b", "c"])?.score).toBe(67);
  });
});
