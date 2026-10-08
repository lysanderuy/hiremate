"use client";

import { Eye, Lock, LockOpen, MoreHorizontal, Pencil, Trash2, Users } from "lucide-react";
import { useState } from "react";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeleteListing } from "@/hooks/use-delete-listing";
import { useUpdateListing } from "@/hooks/use-update-listing";
import { cn } from "@/lib/utils";
import type { ListingResponse } from "@/validators/listing.validator";

const LISTINGS_PATH = "/dashboard/recruiter/listings";
const APPLICANTS_PATH = "/dashboard/recruiter/applicants";
const HAS_APPLICATIONS_MESSAGE = "Close this listing instead. It has applications.";

type ListingRowMenuProps = {
  listing: ListingResponse;
  onError: (message: string | null) => void;
};

export function ListingRowMenu({ listing, onError }: ListingRowMenuProps) {
  const updateListing = useUpdateListing();
  const deleteListing = useDeleteListing();
  const [closeOpen, setCloseOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isRemoved = listing.status === "removed";
  const isOpen = listing.status === "open";
  const hasApplications = listing.applicantCount > 0;
  const busy = updateListing.isPending || deleteListing.isPending;

  function setStatus(status: "open" | "closed") {
    onError(null);
    updateListing.mutate(
      { id: listing.id, input: { status } },
      {
        onError: (error) => onError(error.message),
        onSettled: () => setCloseOpen(false),
      },
    );
  }

  function confirmDelete() {
    onError(null);
    deleteListing.mutate(listing.id, {
      onError: (error) => onError(error.message),
      onSettled: () => setDeleteOpen(false),
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Actions for ${listing.title}`}
          disabled={busy}
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon-sm" }),
            "text-muted-foreground hover:text-ink",
          )}
        >
          <MoreHorizontal aria-hidden="true" className="size-5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLinkItem href={`${LISTINGS_PATH}/${listing.id}`}>
            <Eye aria-hidden="true" />
            View
          </DropdownMenuLinkItem>
          <DropdownMenuLinkItem href={`${APPLICANTS_PATH}?listing=${listing.id}`}>
            <Users aria-hidden="true" />
            View applicants
          </DropdownMenuLinkItem>
          {!isRemoved && (
            <>
              <DropdownMenuLinkItem href={`${LISTINGS_PATH}/${listing.id}/edit`}>
                <Pencil aria-hidden="true" />
                Edit
              </DropdownMenuLinkItem>
              {isOpen ? (
                <DropdownMenuItem onClick={() => setCloseOpen(true)}>
                  <Lock aria-hidden="true" />
                  Close listing
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => setStatus("open")}>
                  <LockOpen aria-hidden="true" />
                  Reopen listing
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                variant="destructive"
                disabled={hasApplications}
                onClick={() => setDeleteOpen(true)}
                className={cn(hasApplications && "items-start")}
              >
                <Trash2 aria-hidden="true" className={cn(hasApplications && "mt-0.5")} />
                <span>
                  Delete
                  {hasApplications && (
                    <small className="block text-xs font-normal text-muted-foreground">
                      {HAS_APPLICATIONS_MESSAGE}
                    </small>
                  )}
                </span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

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
    </>
  );
}
