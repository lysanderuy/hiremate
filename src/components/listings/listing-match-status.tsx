"use client";

import { Button } from "@/components/ui/button";
import { usePrepareListing } from "@/hooks/use-prepare-listing";
import type { ListingResponse } from "@/validators/listing.validator";

export function ListingMatchStatus({ listing }: { listing: ListingResponse }) {
  const prepare = usePrepareListing();

  if (listing.status === "removed" || listing.matchReady) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
      <span className="text-muted-foreground">Preparing…</span>
      <Button
        type="button"
        variant="outline"
        size="xs"
        className="relative z-10"
        disabled={prepare.isPending}
        onClick={() => prepare.mutate(listing.id)}
      >
        {prepare.isPending ? "Retrying..." : "Retry"}
      </Button>
      <span aria-live="polite" className="text-error">
        {prepare.error?.message}
      </span>
    </div>
  );
}
