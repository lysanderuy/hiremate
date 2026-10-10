import { cn } from "@/lib/utils";

type ResumeCalloutProps = {
  tone?: "info" | "error";
  action?: React.ReactNode;
  children: React.ReactNode;
};

export function ResumeCallout({ tone = "info", action, children }: ResumeCalloutProps) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl px-5 py-4 font-medium",
        tone === "error" ? "bg-error-soft text-error-strong" : "bg-primary-soft text-ink",
      )}
    >
      <span>{children}</span>
      {action}
    </div>
  );
}
