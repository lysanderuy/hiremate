import { cn } from "@/lib/utils";
import { APPLICATION_STATUS_LABELS, type ApplicationStatus } from "@/types/applications";

// Green, amber and gray are reserved for score bands, so no status uses them.
const TONES = {
  submitted: "border border-line-dashed bg-white text-text",
  viewed: "bg-weak-soft text-weak",
  shortlisted: "bg-primary-soft text-primary",
  interview: "border border-primary bg-primary-soft font-semibold text-primary-active",
  rejected: "bg-error-soft text-error-strong",
  withdrawn: "border border-dashed border-line-dashed bg-white text-muted-foreground",
  open: "bg-primary-soft text-primary",
  closed: "bg-weak-soft text-weak",
  removed: "bg-error-soft text-error-strong",
} as const;

export type PillTone = keyof typeof TONES;

type StatusPillProps = {
  tone: PillTone;
  className?: string;
  children: React.ReactNode;
};

export function StatusPill({ tone, className, children }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 w-fit shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium whitespace-nowrap before:size-1.5 before:rounded-full before:bg-current before:content-['']",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ApplicationStatusPill({
  status,
  className,
}: {
  status: ApplicationStatus;
  className?: string;
}) {
  return (
    <StatusPill tone={status} className={className}>
      {APPLICATION_STATUS_LABELS[status]}
    </StatusPill>
  );
}
