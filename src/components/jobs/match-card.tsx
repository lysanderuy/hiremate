import { ChipList } from "@/components/jobs/skill-chips";
import { BAND_TEXT, MATCH_BAND_LABELS } from "@/components/shared/match-score";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { MatchBand } from "@/validators/application.validator";

const MAX_MISSING_CHIPS = 8;

export type MatchCardMatch = {
  score: number;
  band: MatchBand;
  matched: string[];
  missing: string[];
};

type MatchCardProps = {
  heading: string;
  tense: "present" | "past";
  match: MatchCardMatch | null;
  fallback: React.ReactNode;
  note: string;
};

function SkillGroup({
  title,
  skills,
  kind,
  max,
}: {
  title: string;
  skills: string[];
  kind: "matched" | "missing";
  max?: number;
}) {
  return (
    <div className="mt-4">
      <h3 className="mb-2 text-sm font-semibold">{title}</h3>
      {skills.length === 0 ? (
        <span className="text-muted-foreground">None</span>
      ) : (
        <ChipList label={title} skills={skills} kind={kind} max={max} />
      )}
    </div>
  );
}

function describeMatch({ band, matched, missing }: MatchCardMatch, tense: "present" | "past") {
  const total = matched.length + missing.length;
  if (total === 0) return "No skills are listed for this job.";
  const verb = tense === "past" ? "had" : "have";
  const asked = tense === "past" ? "asked" : "asks";
  return `${MATCH_BAND_LABELS[band]} match. You ${verb} ${matched.length} of ${total} skills this job ${asked} for.`;
}

export function MatchCard({ heading, tense, match, fallback, note }: MatchCardProps) {
  const total = match ? match.matched.length + match.missing.length : 0;

  return (
    <Card className="gap-0 p-5 min-[641px]:p-6">
      <h2 className="mb-4 text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase">
        {heading}
      </h2>
      {match ? (
        <>
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
          <p className="mt-3 font-medium text-ink">{describeMatch(match, tense)}</p>
          {total > 0 && (
            <>
              <SkillGroup
                title={tense === "past" ? "Skills you had" : "Skills you have"}
                skills={match.matched}
                kind="matched"
              />
              <SkillGroup
                title="Missing"
                skills={match.missing}
                kind="missing"
                max={MAX_MISSING_CHIPS}
              />
            </>
          )}
        </>
      ) : (
        fallback
      )}
      <p className="mt-5 border-t border-line pt-4 text-xs text-muted-foreground">{note}</p>
    </Card>
  );
}
