import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MatchBand } from "@/validators/application.validator";

export const MATCH_BAND_LABELS: Record<MatchBand, string> = {
  strong: "Strong",
  fair: "Fair",
  weak: "Weak",
};

export const BAND_TEXT: Record<MatchBand, string> = {
  strong: "text-strong",
  fair: "text-fair",
  weak: "text-weak",
};

export function getMatchBand(score: number, storedBand?: MatchBand | null): MatchBand {
  if (storedBand) return storedBand;
  if (score >= 70) return "strong";
  if (score >= 40) return "fair";
  return "weak";
}

export function ScoreCell({
  score,
  band: storedBand,
  className,
}: {
  score: number | null;
  band?: MatchBand | null;
  className?: string;
}) {
  if (score === null) return <span className="text-muted-foreground">Not scored</span>;

  const band = getMatchBand(score, storedBand);
  return (
    <span className={cn("inline-flex items-center gap-2 whitespace-nowrap", className)}>
      <span className="flex items-baseline">
        <span
          className={cn(
            "font-display text-lg font-bold tracking-[-0.02em] tabular-nums",
            BAND_TEXT[band],
          )}
        >
          {score}
        </span>
        <span className="text-sm text-muted-foreground">/100</span>
      </span>
      <Badge variant={band}>{MATCH_BAND_LABELS[band]}</Badge>
    </span>
  );
}

export function TopScore({ score, className }: { score: number | null; className?: string }) {
  if (score === null) return <span className="text-muted-foreground">None</span>;

  return (
    <span className="whitespace-nowrap">
      <span
        className={cn(
          "font-display text-lg font-bold tracking-[-0.02em] tabular-nums",
          BAND_TEXT[getMatchBand(score)],
          className,
        )}
      >
        {score}
      </span>
      <span className="text-sm text-muted-foreground">/100</span>
    </span>
  );
}
