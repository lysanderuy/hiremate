import { describe, expect, it } from "vitest";

import { matchStatusMessage } from "./copy";

describe("matchStatusMessage", () => {
  it("returns the product copy for each unscored state", () => {
    expect(matchStatusMessage("no_resume")).toBe("Add a resume to see your match score.");
    expect(matchStatusMessage("listing_not_ready")).toBe(
      "Match score is being prepared. Try again in a moment.",
    );
    expect(matchStatusMessage("model_mismatch")).toBe("Match score is unavailable right now.");
    expect(matchStatusMessage("resume_not_ready")).toContain("not ready");
  });
});
