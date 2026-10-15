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

export function ScoreCell({
  score,
  band,
  className,
}: {
  score: number | null;
  band: MatchBand | null;
  className?: string;
}) {
  if (score === null) return <span className="text-muted-foreground">Not scored</span>;

  return (
    <span className={cn("inline-flex items-center gap-2 whitespace-nowrap", className)}>
      <span className="flex items-baseline">
        <span
          className={cn(
            "font-display text-lg font-bold tracking-[-0.02em] tabular-nums",
            band ? BAND_TEXT[band] : "text-ink",
          )}
        >
          {score}
        </span>
        <span className="text-sm text-muted-foreground">/100</span>
      </span>
      {band && <Badge variant={band}>{MATCH_BAND_LABELS[band]}</Badge>}
    </span>
  );
}

export function TopScore({
  score,
  band,
  className,
}: {
  score: number | null;
  band: MatchBand | null;
  className?: string;
}) {
  if (score === null) return <span className="text-muted-foreground">None</span>;

  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <span className="flex items-baseline">
        <span
          className={cn(
            "font-display text-lg font-bold tracking-[-0.02em] tabular-nums",
            band ? BAND_TEXT[band] : "text-ink",
            className,
          )}
        >
          {score}
        </span>
        <span className="text-sm text-muted-foreground">/100</span>
      </span>
      {band && <Badge variant={band}>{MATCH_BAND_LABELS[band]}</Badge>}
    </span>
  );
}
