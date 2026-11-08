import { describe, expect, it } from "vitest";

import {
  APPLICANT_APPLICATION_STATUSES,
  APPLICATION_STATUSES,
  WITHDRAWABLE_STATUSES,
  canWithdraw,
} from "./applications";

describe("APPLICANT_APPLICATION_STATUSES", () => {
  it("contains every application status", () => {
    for (const status of APPLICATION_STATUSES)
      expect(APPLICANT_APPLICATION_STATUSES).toContain(status);
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
