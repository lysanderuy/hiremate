import { Info } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

import { MatchBar, MissingSkills } from "./match-bar";

const bands = [
  {
    range: "70 to 100",
    name: "Strong",
    variant: "strong",
    text: "Most of what the job asks for is in your resume.",
  },
  {
    range: "40 to 69",
    name: "Fair",
    variant: "fair",
    text: "Some overlap. Check the missing skills.",
  },
  {
    range: "0 to 39",
    name: "Weak",
    variant: "weak",
    text: "Little overlap with this listing.",
  },
] as const;

export function AiMatching() {
  return (
    <section id="matching" className="section-screen">
      <div className="site-container grid grid-cols-1 items-center gap-12 min-[961px]:grid-cols-2 min-[961px]:gap-18 *:min-w-0">
        <div>
          <p className="eyebrow">AI Matching</p>
          <h2 className="text-section font-semibold">Understanding your match in plain language</h2>
          <p className="mt-3 text-lead">
            Every score is out of 100 and comes with its reasons. You see the skills you match, the
            ones you lack, and what the number means.
          </p>
          <ul aria-label="Score bands" className="mt-8 grid gap-3">
            {bands.map((band) => (
              <li
                key={band.name}
                className="grid grid-cols-[84px_72px_1fr] items-center gap-3 rounded-md border border-line bg-surface px-4 py-3 min-[641px]:grid-cols-[96px_80px_1fr] min-[641px]:gap-4"
              >
                <span className="font-display font-semibold whitespace-nowrap text-ink tabular-nums">
                  {band.range}
                </span>
                <Badge variant={band.variant} className="justify-self-start">
                  {band.name}
                </Badge>
                <span className="text-sm">{band.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <Card className="gap-0 px-5 pt-8 pb-5 shadow-md min-[641px]:px-8 min-[641px]:pt-12 min-[641px]:pb-8">
          <div className="mb-5 border-b border-line pb-5 text-center">
            <p className="font-display text-score-sm leading-none font-bold tracking-[-0.04em] text-strong tabular-nums min-[641px]:text-score">
              78
              <small className="text-lg font-medium tracking-normal text-muted-foreground">
                /100
              </small>
            </p>
            <p className="mt-2 font-semibold text-strong">Strong match</p>
            <p className="mt-3">You have 6 of 8 skills this job asks for.</p>
          </div>
          <div className="grid gap-4">
            <MatchBar label="Skills match" valueLabel="6 of 8" percent={75} />
            <MatchBar
              label="Description match"
              valueLabel="High"
              percent={82}
              help="How closely your resume reads like the job description."
            />
          </div>
          <div className="mt-5">
            <MissingSkills skills={["Docker", "AWS"]} />
          </div>
          <p className="mt-5 flex gap-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            AI-generated results are intended to assist users and may require human verification.
          </p>
        </Card>
      </div>
    </section>
  );
}
