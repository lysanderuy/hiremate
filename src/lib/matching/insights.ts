import type { MatchBreakdown } from "@/validators/application.validator";

export type InsightAudience = "applicant" | "recruiter";

type Clause = { text: string; tone: "positive" | "neutral" | "negative" };

function skillsClause(points: number, audience: InsightAudience): Clause {
  const recruiter = audience === "recruiter";
  if (points >= 20) {
    return {
      text: `${recruiter ? "The applicant's" : "Your"} skills line up well with what this job asks for`,
      tone: "positive",
    };
  }
  if (points >= 5) {
    return {
      text: `${recruiter ? "Some of the applicant's" : "Some of your"} skills line up with what this job asks for`,
      tone: "positive",
    };
  }
  if (points > -5) return { text: "Skills made little difference here", tone: "neutral" };
  return {
    text: `${recruiter ? "Few of the applicant's" : "Few of your"} skills line up with what this job asks for`,
    tone: "negative",
  };
}

function contentClause(points: number, audience: InsightAudience): Clause {
  const subject = audience === "recruiter" ? "The applicant's resume" : "Your resume";
  if (points >= 5)
    return { text: `${subject} covers very similar ground to this job`, tone: "positive" };
  if (points > -5) {
    return { text: `${subject} covers some of the same ground as this job`, tone: "neutral" };
  }
  return { text: `${subject} covers different ground than this job`, tone: "negative" };
}

export function describeBreakdown(breakdown: MatchBreakdown, audience: InsightAudience): string {
  const first = skillsClause(breakdown.skills, audience);
  const second = contentClause(breakdown.content, audience);
  const opposed =
    first.tone !== "neutral" && second.tone !== "neutral" && first.tone !== second.tone;

  if (opposed) {
    return `${first.text}, but ${second.text.charAt(0).toLowerCase()}${second.text.slice(1)}.`;
  }
  return `${first.text}. ${second.text}.`;
}
