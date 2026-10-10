import { describe, expect, it } from "vitest";

import { APPLICATION_STATUSES, toApplicantStatus } from "./applications";

describe("toApplicantStatus", () => {
  it("maps interview to shortlisted", () => {
    expect(toApplicantStatus("interview")).toBe("shortlisted");
  });

  it("leaves every other status unchanged", () => {
    for (const status of APPLICATION_STATUSES.filter((value) => value !== "interview")) {
      expect(toApplicantStatus(status)).toBe(status);
    }
  });
});
