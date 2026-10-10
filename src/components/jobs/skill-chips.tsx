import { MatchedChip, MissingChip, MoreChip } from "@/components/applicants/skill-chip";
import { cn } from "@/lib/utils";

export function NeutralChip({ children }: { children: React.ReactNode }) {
  return (
    <li className="inline-flex h-7 items-center rounded-full bg-weak-soft px-3 text-chip font-medium break-all text-weak">
      {children}
    </li>
  );
}

type ChipKind = "matched" | "missing" | "neutral";

const CHIPS = { matched: MatchedChip, missing: MissingChip, neutral: NeutralChip } as const;

export function ChipList({
  label,
  skills,
  kind,
  max,
  className,
}: {
  label: string;
  skills: string[];
  kind: ChipKind;
  max?: number;
  className?: string;
}) {
  const Chip = CHIPS[kind];
  const shown = max === undefined ? skills : skills.slice(0, max);
  const hidden = skills.length - shown.length;

  return (
    <ul aria-label={label} className={cn("flex flex-wrap gap-2", className)}>
      {shown.map((skill) => (
        <Chip key={skill}>{skill}</Chip>
      ))}
      {hidden > 0 && <MoreChip count={hidden} />}
    </ul>
  );
}
