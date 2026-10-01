import { ArrowRight, FileText, Sparkles, Star } from "lucide-react";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { MatchBar } from "./match-bar";

const stats = [
  { value: "2,400+", label: "Active Jobs" },
  { value: "18,000+", label: "Candidates" },
  { value: "94%", label: "Match Accuracy" },
];

const skills = ["Python", "SQL", "Machine Learning", "React", "Git"];

const breakdown = [
  { label: "Skills", value: 95 },
  { label: "Experience", value: 90 },
  { label: "Education", value: 100 },
];

export function Hero() {
  return (
    <section className="bg-white py-16 md:py-24">
      <div className="mx-auto grid max-w-7xl px-4 sm:px-6 lg:px-8 grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="mx-auto w-full max-w-xl lg:mx-0 lg:max-w-none">
          <Badge
            variant="outline"
            className="h-7 gap-1.5 border-tint-border bg-tint px-3 text-xs text-primary"
          >
            <Star className="fill-current" />
            AI-Powered Recruitment Platform
          </Badge>
          <h1 className="mt-6 text-balance text-3xl min-[360px]:text-4xl leading-[1.1] font-bold tracking-tight text-navy sm:text-5xl xl:text-6xl">
            Where AI Meets
            <br />
            <span className="text-primary">Career Potential</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed sm:text-lg text-slate-600">
            AI-powered resume analysis and job matching that helps candidates showcase their
            potential and helps recruiters discover the right talent faster.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signup"
              className={cn(buttonVariants({ size: "lg" }), "h-11 px-6 text-base")}
            >
              Get Started for Free
              <ArrowRight />
            </Link>
            <Button variant="outline" size="lg" className="h-11 px-6 text-base">
              Explore Jobs
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-8 gap-y-4 border-t pt-8 sm:gap-x-10">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-bold text-navy">{stat.value}</p>
                <p className="text-sm text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto w-full max-w-xl rounded-2xl bg-tint p-3 sm:p-6 lg:mx-0 lg:max-w-none lg:p-8">
          <Card className="gap-4 border bg-white p-4 sm:p-5 shadow-sm ring-0">
            <div className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500">
                <FileText className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-navy">Resume Analyzed</p>
                <p className="truncate text-xs text-slate-500">John_Doe_Resume.pdf</p>
              </div>
              <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-match">
                <span className="size-2 rounded-full bg-match-bar" />
                Complete
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full bg-tint px-3 py-1 text-xs font-medium text-primary"
                >
                  {skill}
                </span>
              ))}
            </div>
          </Card>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-tint-border" />
            <span className="flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-medium text-white">
              <Sparkles className="size-3" />
              AI Analysis
            </span>
            <div className="h-px flex-1 bg-tint-border" />
          </div>

          <Card className="gap-4 border bg-white p-5 shadow-sm ring-0">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-navy">Junior Data Analyst</p>
                <p className="text-xs text-slate-500">ABC Technologies · Cebu City</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-2xl leading-none font-bold text-match">91%</p>
                <p className="mt-1 text-xs font-medium text-match">Strong Match</p>
              </div>
            </div>
            <div className="space-y-3">
              {breakdown.map((item) => (
                <MatchBar
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  indicatorClassName="bg-match-bar"
                  inline
                />
              ))}
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
