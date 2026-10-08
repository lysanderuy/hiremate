import { cn } from "@/lib/utils";

type MatchBarProps = {
  label: string;
  valueLabel: string;
  percent: number;
  tone?: "primary" | "strong";
  help?: string;
};

export function MatchBar({ label, valueLabel, percent, tone = "primary", help }: MatchBarProps) {
  return (
    <div className="grid gap-1.5">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <b className="font-semibold text-ink">{valueLabel}</b>
      </div>
      <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-weak-soft">
        <span
          className={cn(
            "block h-full rounded-full",
            tone === "strong" ? "bg-strong" : "bg-primary",
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      {help && <small className="text-xs text-muted-foreground">{help}</small>}
    </div>
  );
}

export function SkillChip({ children, missing = false }: { children: string; missing?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-full px-3 text-chip font-medium",
        missing
          ? "border border-dashed border-line-dashed bg-surface text-muted-foreground"
          : "bg-primary-soft text-primary",
      )}
    >
      {children}
    </span>
  );
}

export function MissingSkills({ skills }: { skills: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-muted-foreground">
      Missing
      {skills.map((skill) => (
        <SkillChip key={skill} missing>
          {skill}
        </SkillChip>
      ))}
    </div>
  );
}
