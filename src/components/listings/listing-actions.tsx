"use client";

import Link from "next/link";
import { useState } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { useDeleteListing } from "@/hooks/use-delete-listing";
import { useUpdateListing } from "@/hooks/use-update-listing";
import type { ListingResponse } from "@/validators/listing.validator";

const HAS_APPLICATIONS_MESSAGE = "Close this listing instead. It has applications.";

type ListingActionsProps = {
  listing: ListingResponse;
  onDeleted?: () => void;
};

export function ListingActions({ listing, onDeleted }: ListingActionsProps) {
  const updateListing = useUpdateListing();
  const deleteListing = useDeleteListing();
  const [confirming, setConfirming] = useState(false);

  const hasApplications = listing.applicantCount > 0;
  const isOpen = listing.status === "open";
  const busy = updateListing.isPending || deleteListing.isPending;
  const errorMessage = updateListing.error?.message ?? deleteListing.error?.message;

  function toggleStatus() {
    deleteListing.reset();
    updateListing.mutate({
      id: listing.id,
      input: { status: isOpen ? "closed" : "open" },
    });
  }

  function confirmDelete() {
    updateListing.reset();
    deleteListing.mutate(listing.id, {
      onSuccess: onDeleted,
      onSettled: () => setConfirming(false),
    });
  }

  return (
    <div className="space-y-2">
      {confirming ? (
        <div className="space-y-2" role="group" aria-label="Confirm delete">
          <p className="text-sm text-navy">Delete this listing? This cannot be undone.</p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="destructive"
              size="lg"
              disabled={busy}
              onClick={confirmDelete}
            >
              {deleteListing.isPending ? "Deleting..." : "Confirm"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={busy}
              onClick={() => setConfirming(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/dashboard/recruiter/listings/${listing.id}/edit`}
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            Edit
          </Link>
          <Button type="button" variant="outline" size="lg" disabled={busy} onClick={toggleStatus}>
            {updateListing.isPending ? "Saving..." : isOpen ? "Close" : "Reopen"}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="lg"
            disabled={busy || hasApplications}
            title={hasApplications ? HAS_APPLICATIONS_MESSAGE : undefined}
            onClick={() => {
              updateListing.reset();
              deleteListing.reset();
              setConfirming(true);
            }}
          >
            Delete
          </Button>
        </div>
      )}
      {hasApplications && !confirming && (
        <p className="text-xs text-muted-foreground">{HAS_APPLICATIONS_MESSAGE}</p>
      )}
      {errorMessage && (
        <p role="alert" className="text-sm text-red-600">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
