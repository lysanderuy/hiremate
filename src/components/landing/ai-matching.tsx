import { CircleCheck, Info } from "lucide-react";

import { MatchBar } from "./match-bar";

const dimensions = [
  { title: "Skills Match", description: "How many required skills appear in your profile" },
  {
    title: "Semantic Similarity",
    description: "How closely your experience aligns with the role description",
  },
  {
    title: "Experience Level",
    description: "Whether your years of experience meet the requirement",
  },
  { title: "Education", description: "Whether your educational background fits the position" },
];

const scores = [
  { label: "Skills Match", value: 95, indicatorClassName: "bg-primary" },
  { label: "Semantic Similarity", value: 89, indicatorClassName: "bg-violet-500" },
  { label: "Experience", value: 90, indicatorClassName: "bg-match-bar" },
  { label: "Education", value: 100, indicatorClassName: "bg-blue-500" },
];

export function AiMatching() {
  return (
    <section id="ai-matching" className="scroll-mt-16 bg-section py-16 md:py-24">
      <div className="mx-auto grid max-w-7xl px-4 sm:px-6 lg:px-8 grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="mx-auto w-full max-w-2xl lg:mx-0 lg:max-w-none">
          <p className="text-xs font-semibold tracking-wider text-primary sm:text-sm uppercase">
            AI Matching
          </p>
          <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl text-navy">
            Understanding your match in plain language
          </h2>
          <p className="mt-5 text-base leading-relaxed sm:text-lg text-slate-600">
            Our AI compares your resume against each job description across multiple dimensions. You
            always see a clear explanation, not just a number.
          </p>
          <ul className="mt-8 space-y-5">
            {dimensions.map((item) => (
              <li key={item.title} className="flex gap-3">
                <CircleCheck className="mt-0.5 size-5 shrink-0 text-primary" />
                <div>
                  <p className="text-base font-semibold text-navy">{item.title}</p>
                  <p className="text-sm text-slate-500">{item.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mx-auto w-full max-w-xl rounded-2xl border bg-white p-6 shadow-sm sm:p-8 lg:p-10">
          <div className="text-center">
            <p className="text-5xl font-bold text-match sm:text-6xl">91%</p>
            <p className="mt-1 text-sm font-medium text-match">Strong Match</p>
            <p className="mx-auto mt-4 max-w-sm text-sm text-slate-600">
              You meet most requirements and your experience closely aligns with this role.
            </p>
          </div>
          <div className="my-7 h-px bg-border" />
          <div className="space-y-5">
            {scores.map((score) => (
              <MatchBar key={score.label} {...score} />
            ))}
          </div>
          <p className="mt-7 flex items-start gap-2 text-xs text-slate-500">
            <Info className="mt-0.5 size-4 shrink-0" />
            AI-generated results are intended to assist users and may require human verification.
          </p>
        </div>
      </div>
    </section>
  );
}
