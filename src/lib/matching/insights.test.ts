import { describe, expect, it } from "vitest";

import { describeBreakdown } from "./insights";

const base = { start: 25, skills: 0, content: 0 };
const NEUTRAL_CONTENT = "Your resume covers some of the same ground as this job.";

describe("describeBreakdown skills sentence", () => {
  it.each([
    [41, "Your skills line up well with what this job asks for."],
    [20, "Your skills line up well with what this job asks for."],
    [19, "Some of your skills line up with what this job asks for."],
    [5, "Some of your skills line up with what this job asks for."],
    [4, "Skills made little difference here."],
    [-4, "Skills made little difference here."],
  ])("skills %i", (skills, expected) => {
    expect(describeBreakdown({ ...base, skills }, "applicant")).toBe(
      `${expected} ${NEUTRAL_CONTENT}`,
    );
  });

  it("describes few matching skills at -5", () => {
    expect(describeBreakdown({ ...base, skills: -5 }, "applicant")).toBe(
      `Few of your skills line up with what this job asks for. ${NEUTRAL_CONTENT}`,
    );
  });
});

describe("describeBreakdown resume content sentence", () => {
  it.each([
    [5, "Your resume covers very similar ground to this job."],
    [4, "Your resume covers some of the same ground as this job."],
    [-4, "Your resume covers some of the same ground as this job."],
    [-5, "Your resume covers different ground than this job."],
  ])("content %i", (content, expected) => {
    expect(describeBreakdown({ ...base, content }, "applicant")).toBe(
      `Skills made little difference here. ${expected}`,
    );
  });
});

describe("describeBreakdown joining", () => {
  it("joins opposing tones with but", () => {
    expect(describeBreakdown({ start: 25, skills: 30, content: -8 }, "applicant")).toBe(
      "Your skills line up well with what this job asks for, but your resume covers different ground than this job.",
    );
    expect(describeBreakdown({ start: 25, skills: -9, content: 6 }, "applicant")).toBe(
      "Few of your skills line up with what this job asks for, but your resume covers very similar ground to this job.",
    );
  });

  it("joins matching tones as two sentences", () => {
    expect(describeBreakdown({ start: 25, skills: 10, content: 6 }, "applicant")).toBe(
      "Some of your skills line up with what this job asks for. Your resume covers very similar ground to this job.",
    );
  });

  it("uses third person for recruiters", () => {
    expect(describeBreakdown({ start: 25, skills: 30, content: -8 }, "recruiter")).toBe(
      "The applicant's skills line up well with what this job asks for, but the applicant's resume covers different ground than this job.",
    );
    expect(describeBreakdown({ start: 25, skills: -9, content: 0 }, "recruiter")).toBe(
      "Few of the applicant's skills line up with what this job asks for. The applicant's resume covers some of the same ground as this job.",
    );
  });

  it("ignores the starting points", () => {
    expect(describeBreakdown({ start: 0, skills: 0, content: 0 }, "applicant")).toBe(
      describeBreakdown({ start: 99, skills: 0, content: 0 }, "applicant"),
    );
  });
});
