import { StatusPill } from "@/components/shared/status-pill";
import type { ListingResponse } from "@/validators/listing.validator";

const LABELS: Record<ListingResponse["status"], string> = {
  open: "Open",
  closed: "Closed",
  removed: "Removed",
};

export function ListingStatusBadge({ status }: { status: ListingResponse["status"] }) {
  return <StatusPill tone={status}>{LABELS[status]}</StatusPill>;
}
