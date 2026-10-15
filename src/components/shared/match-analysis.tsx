import { ChipList } from "@/components/jobs/skill-chips";
import { BAND_TEXT, MATCH_BAND_LABELS } from "@/components/shared/match-score";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { NO_SKILLS_NOTE } from "@/lib/matching/copy";
import { describeBreakdown, type InsightAudience } from "@/lib/matching/insights";
import { cn } from "@/lib/utils";
import type { MatchBand, MatchBreakdown } from "@/validators/application.validator";

export type MatchAnalysisMatch = {
  score: number;
  band: MatchBand;
  breakdown: MatchBreakdown | null;
};

export type MatchAnalysisSkills = {
  matched: string[];
  missing: string[];
};

type MatchAnalysisProps = {
  audience: InsightAudience;
  match: MatchAnalysisMatch | null;
  skills: MatchAnalysisSkills | null;
  fallback: React.ReactNode;
  className?: string;
};

const EYEBROW_CLASS =
  "mb-3 text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase";

function SkillGroup({
  title,
  skills,
  kind,
}: {
  title: string;
  skills: string[];
  kind: "matched" | "missing";
}) {
  if (skills.length === 0) return null;

  return (
    <div>
      <h4 className="mb-2 text-xs font-medium text-muted-foreground">
        {title} <span className="font-normal">({skills.length})</span>
      </h4>
      <ChipList label={title} skills={skills} kind={kind} />
    </div>
  );
}

function SkillsComparison({ skills }: { skills: MatchAnalysisSkills | null }) {
  if (!skills) return <p className="text-sm text-muted-foreground">{NO_SKILLS_NOTE}</p>;

  const matched = skills.matched.length;
  const total = matched + skills.missing.length;
  const showGroups = skills.missing.length > 0;

  return (
    <>
      <div
        role="meter"
        aria-label="Skills matched"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={matched}
        aria-valuetext={`${matched} of ${total}`}
        className="h-2 overflow-hidden rounded-full bg-weak-soft"
      >
        <span
          className="block h-full rounded-full bg-primary"
          style={{ width: `${(matched / total) * 100}%` }}
        />
      </div>
      {showGroups && (
        <div className="mt-4 grid gap-4">
          <SkillGroup title="Matched" skills={skills.matched} kind="matched" />
          <SkillGroup title="Missing" skills={skills.missing} kind="missing" />
        </div>
      )}
    </>
  );
}

export function MatchAnalysis({
  audience,
  match,
  skills,
  fallback,
  className,
}: MatchAnalysisProps) {
  const showSkills = match !== null || audience === "recruiter";

  return (
    <Card className={cn("gap-0 p-5 min-[641px]:p-6", className)}>
      <h2 className="mb-5 text-base font-semibold">Match analysis</h2>

      <section>
        <h3 className={EYEBROW_CLASS}>AI match score</h3>
        {match ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div
              className={cn(
                "font-display text-score-sm leading-none font-bold tracking-[-0.04em] tabular-nums sm:text-score",
                BAND_TEXT[match.band],
              )}
            >
              {match.score}
              <small className="text-lg font-medium tracking-normal text-muted-foreground">
                {" "}
                /100
              </small>
            </div>
            <Badge variant={match.band}>{MATCH_BAND_LABELS[match.band]}</Badge>
          </div>
        ) : (
          fallback
        )}
      </section>

      {showSkills && (
        <section className="mt-6">
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <h3 className={cn(EYEBROW_CLASS, "mb-0")}>Skills comparison</h3>
            {skills && (
              <span aria-hidden="true" className="text-sm font-semibold text-ink tabular-nums">
                {skills.matched.length} of {skills.matched.length + skills.missing.length}
              </span>
            )}
          </div>
          <SkillsComparison skills={skills} />
        </section>
      )}

      {match?.breakdown && (
        <p className="mt-6 text-sm text-muted-foreground">
          {describeBreakdown(match.breakdown, audience)}
        </p>
      )}
    </Card>
  );
}
