import { describe, expect, it } from "vitest";

import { formatDate, formatPostedAgo, formatSalaryRange } from "./format";

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

describe("formatPostedAgo", () => {
  const now = new Date("2026-10-10T12:00:00.000Z");

  it("says today for the same UTC day", () => {
    expect(formatPostedAgo("2026-10-10T00:00:00.000Z", now)).toBe("Posted today");
  });

  it("says yesterday across midnight even when under 24 hours apart", () => {
    expect(formatPostedAgo("2026-10-09T23:00:00.000Z", now)).toBe("Posted yesterday");
  });

  it("counts days up to 30", () => {
    expect(formatPostedAgo("2026-10-05T09:00:00.000Z", now)).toBe("Posted 5 days ago");
    expect(formatPostedAgo("2026-09-10T09:00:00.000Z", now)).toBe("Posted 30 days ago");
  });

  it("falls back to the date after 30 days", () => {
    expect(formatPostedAgo("2026-09-09T09:00:00.000Z", now)).toBe("Posted Sep 9, 2026");
  });

  it("treats a future timestamp as today", () => {
    expect(formatPostedAgo("2026-10-11T09:00:00.000Z", now)).toBe("Posted today");
  });
});
