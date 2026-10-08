"use client";

import { Lock, LockOpen, Pencil } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
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
  const [closeOpen, setCloseOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const hasApplications = listing.applicantCount > 0;
  const isOpen = listing.status === "open";
  const busy = updateListing.isPending || deleteListing.isPending;
  const errorMessage = updateListing.error?.message ?? deleteListing.error?.message;

  function setStatus(status: "open" | "closed") {
    deleteListing.reset();
    updateListing.mutate(
      { id: listing.id, input: { status } },
      { onSettled: () => setCloseOpen(false) },
    );
  }

  function confirmDelete() {
    updateListing.reset();
    deleteListing.mutate(listing.id, {
      onSuccess: onDeleted,
      onSettled: () => setDeleteOpen(false),
    });
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 min-[961px]:justify-end">
        <Link
          href={`/dashboard/recruiter/listings/${listing.id}/edit`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <Pencil aria-hidden="true" />
          Edit
        </Link>
        {isOpen ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => setCloseOpen(true)}
          >
            <Lock aria-hidden="true" />
            Close
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => setStatus("open")}
          >
            <LockOpen aria-hidden="true" />
            {updateListing.isPending ? "Reopening..." : "Reopen"}
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy || hasApplications}
          className={hasApplications ? undefined : "text-error-strong"}
          onClick={() => {
            updateListing.reset();
            deleteListing.reset();
            setDeleteOpen(true);
          }}
        >
          Delete
        </Button>
      </div>
      {hasApplications && (
        <p className="mt-1.5 text-xs text-muted-foreground min-[961px]:text-right">
          {HAS_APPLICATIONS_MESSAGE}
        </p>
      )}
      {errorMessage && (
        <p role="alert" className="mt-2 text-xs text-error min-[961px]:text-right">
          {errorMessage}
        </p>
      )}

      <ConfirmDialog
        open={closeOpen}
        onOpenChange={setCloseOpen}
        title="Close this listing?"
        description="It leaves the job list and applicants can no longer apply. Existing applications stay."
        confirmLabel={updateListing.isPending ? "Closing..." : "Close listing"}
        pending={updateListing.isPending}
        onConfirm={() => setStatus("closed")}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this listing?"
        description={`"${listing.title}" will be deleted for good. This cannot be undone.`}
        confirmLabel={deleteListing.isPending ? "Deleting..." : "Delete"}
        danger
        pending={deleteListing.isPending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
