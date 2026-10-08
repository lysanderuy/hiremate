import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ListingResponse } from "@/validators/listing.validator";

const STATUS_STYLES: Record<ListingResponse["status"], { label: string; className: string }> = {
  open: { label: "Open", className: "bg-emerald-50 text-emerald-700" },
  closed: { label: "Closed", className: "bg-slate-100 text-slate-600" },
  removed: { label: "Removed", className: "bg-red-50 text-red-600" },
};

export function ListingStatusBadge({ status }: { status: ListingResponse["status"] }) {
  const { label, className } = STATUS_STYLES[status];
  return <Badge className={cn(className)}>{label}</Badge>;
}
