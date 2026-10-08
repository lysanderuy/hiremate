import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { APPLICATION_STATUS_LABELS, type ApplicationStatus } from "@/types/applications";

const STATUS_STYLES: Record<ApplicationStatus, string> = {
  submitted: "bg-blue-50 text-blue-700",
  viewed: "bg-slate-100 text-slate-600",
  shortlisted: "bg-emerald-50 text-emerald-700",
  interview: "bg-violet-50 text-violet-700",
  rejected: "bg-red-50 text-red-600",
  withdrawn: "bg-amber-50 text-amber-700",
};

type ApplicationStatusBadgeProps = {
  status: ApplicationStatus;
  className?: string;
};

export function ApplicationStatusBadge({ status, className }: ApplicationStatusBadgeProps) {
  return (
    <Badge className={cn(STATUS_STYLES[status], className)}>
      {APPLICATION_STATUS_LABELS[status]}
    </Badge>
  );
}
