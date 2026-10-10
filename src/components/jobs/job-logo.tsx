import { cn } from "@/lib/utils";

export function JobLogo({ company, className }: { company: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-11 shrink-0 place-items-center rounded-lg bg-primary-soft font-display text-lg font-semibold text-primary",
        className,
      )}
    >
      {company.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
