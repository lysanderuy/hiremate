import { MatchedChip, MoreChip } from "@/components/applicants/skill-chip";

export function SkillChips({ skills, max }: { skills: string[]; max?: number }) {
  const shown = max === undefined ? skills : skills.slice(0, max);
  const hidden = skills.length - shown.length;

  return (
    <ul aria-label="Skills" className="flex flex-wrap gap-2">
      {shown.map((skill) => (
        <MatchedChip key={skill}>{skill}</MatchedChip>
      ))}
      {hidden > 0 && <MoreChip count={hidden} />}
    </ul>
  );
}
