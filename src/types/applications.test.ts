import { describe, expect, it } from "vitest";

import {
  APPLICATION_STATUSES,
  WITHDRAWABLE_STATUSES,
  canWithdraw,
  toApplicantStatus,
} from "./applications";

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

describe("canWithdraw", () => {
  it("allows every in-progress status", () => {
    for (const status of ["submitted", "viewed", "shortlisted", "interview"] as const) {
      expect(canWithdraw(status)).toBe(true);
    }
  });

  it("blocks terminal statuses", () => {
    expect(canWithdraw("rejected")).toBe(false);
    expect(canWithdraw("withdrawn")).toBe(false);
  });

  it("only lists known statuses", () => {
    for (const status of WITHDRAWABLE_STATUSES) expect(APPLICATION_STATUSES).toContain(status);
  });
});
