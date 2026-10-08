import { FileText } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { SparkleIcon } from "./logo";
import { MatchBar, MissingSkills, SkillChip } from "./match-bar";

const proof = [
  { value: "853", label: "Job postings tested" },
  { value: "24", label: "Resume categories" },
  { value: "0 to 100", label: "Score with reasons" },
];

const skills = ["Python", "SQL", "Pandas", "Git", "Excel", "Tableau"];

export function Hero() {
  return (
    <section className="section-screen">
      <div className="site-container grid grid-cols-1 items-center gap-12 min-[961px]:grid-cols-2 min-[961px]:gap-18 *:min-w-0">
        <div>
          <h1 className="text-hero font-bold">
            Where AI Meets <span className="block text-primary">Career Potential</span>
          </h1>
          <p className="mt-6 max-w-[540px] text-lead">
            Resume analysis and job matching that helps applicants see where they fit, and helps
            recruiters find the right people faster.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className={cn(buttonVariants({ size: "lg" }), "max-[640px]:flex-[1_1_100%]")}
            >
              Get Started
            </Link>
            <Link
              href="/jobs"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "max-[640px]:flex-[1_1_100%]",
              )}
            >
              Explore Jobs
            </Link>
          </div>
          <dl className="mt-12 flex flex-wrap gap-x-6 gap-y-4 border-t border-line pt-6 min-[641px]:gap-x-12">
            {proof.map((item) => (
              <div key={item.label}>
                <dt className="font-display text-2xl leading-tight font-semibold tracking-[-0.02em] text-ink">
                  {item.value}
                </dt>
                <dd className="text-sm text-muted-foreground">{item.label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div
          role="group"
          aria-label="Example analysis"
          className="rounded-2xl bg-primary-soft p-4 min-[641px]:p-8"
        >
          <Card className="gap-0 p-5">
            <div className="mb-4 flex items-center gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-error-soft text-error">
                <FileText className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <b className="block font-display font-semibold text-ink">Resume Analyzed</b>
                <small className="block truncate text-sm text-muted-foreground">
                  Sample_Resume.pdf
                </small>
              </div>
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-strong">
                <span aria-hidden="true" className="size-2 rounded-full bg-strong" />
                Complete
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <SkillChip key={skill}>{skill}</SkillChip>
              ))}
            </div>
          </Card>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-primary-soft-line" />
            <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-semibold text-white">
              <SparkleIcon className="size-3.5" />
              AI Analysis
            </span>
            <div className="h-px flex-1 bg-primary-soft-line" />
          </div>

          <Card className="gap-0 p-5">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="font-display text-base font-semibold text-ink">Junior Data Analyst</p>
                <p className="text-sm text-muted-foreground">Cebu City &middot; Full-time</p>
              </div>
              <div className="text-right">
                <p className="font-display text-numeral leading-none font-bold tracking-[-0.03em] text-strong tabular-nums">
                  78
                  <small className="text-sm font-medium tracking-normal text-muted-foreground">
                    /100
                  </small>
                </p>
                <Badge variant="strong" className="mt-1">
                  Strong match
                </Badge>
              </div>
            </div>
            <div className="grid gap-4">
              <MatchBar label="Skills" valueLabel="6 of 8" percent={75} tone="strong" />
              <MatchBar label="Description match" valueLabel="High" percent={82} tone="strong" />
            </div>
            <div className="mt-5">
              <MissingSkills skills={["Docker", "AWS"]} />
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
