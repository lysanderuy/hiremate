import { describe, expect, it } from "vitest";

import { bandFromScore } from "./score";

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
