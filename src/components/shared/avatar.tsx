import { cn } from "@/lib/utils";

export function getInitials(name: string): string {
  const letters = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]);
  return letters.length > 0 ? letters.join("").toUpperCase() : "?";
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full bg-primary-soft font-display text-sm font-semibold text-primary",
        className,
      )}
    >
      {getInitials(name)}
    </span>
  );
}
