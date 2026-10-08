import { describe, expect, it } from "vitest";

import { formatDate, formatSalaryRange } from "./format";

describe("formatSalaryRange", () => {
  it("formats a range with thousands separators", () => {
    expect(formatSalaryRange(30000, 45000)).toBe("PHP 30,000 to 45,000 per month");
  });

  it("formats a range with equal amounts", () => {
    expect(formatSalaryRange(0, 0)).toBe("PHP 0 to 0 per month");
  });

  it("returns Not specified when either amount is null", () => {
    expect(formatSalaryRange(null, null)).toBe("Not specified");
    expect(formatSalaryRange(30000, null)).toBe("Not specified");
    expect(formatSalaryRange(null, 45000)).toBe("Not specified");
  });
});

describe("formatDate", () => {
  it("formats an ISO date in UTC", () => {
    expect(formatDate("2026-09-20T10:00:00.000Z")).toBe("Sep 20, 2026");
  });

  it("does not shift the day near midnight UTC", () => {
    expect(formatDate("2026-09-20T23:59:59.000Z")).toBe("Sep 20, 2026");
  });
});
