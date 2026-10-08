"use client";

import { MoreHorizontal } from "lucide-react";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeleteListing } from "@/hooks/use-delete-listing";
import { useUpdateListing } from "@/hooks/use-update-listing";
import type { ListingResponse } from "@/validators/listing.validator";

const LISTINGS_PATH = "/dashboard/recruiter/listings";
const HAS_APPLICATIONS_MESSAGE = "Close this listing instead. It has applications.";

type ListingRowMenuProps = {
  listing: ListingResponse;
  onError: (message: string | null) => void;
};

export function ListingRowMenu({ listing, onError }: ListingRowMenuProps) {
  const updateListing = useUpdateListing();
  const deleteListing = useDeleteListing();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const isRemoved = listing.status === "removed";
  const isOpen = listing.status === "open";
  const hasApplications = listing.applicantCount > 0;
  const busy = updateListing.isPending || deleteListing.isPending;

  function toggleStatus() {
    onError(null);
    updateListing.mutate(
      { id: listing.id, input: { status: isOpen ? "closed" : "open" } },
      { onError: (error) => onError(error.message) },
    );
  }

  function confirmDelete() {
    onError(null);
    deleteListing.mutate(listing.id, {
      onError: (error) => onError(error.message),
      onSettled: () => setConfirmOpen(false),
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Actions for ${listing.title}`}
          disabled={busy}
          className={buttonVariants({ variant: "outline", size: "icon-lg" })}
        >
          <MoreHorizontal aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLinkItem href={`${LISTINGS_PATH}/${listing.id}`}>View</DropdownMenuLinkItem>
          {!isRemoved && (
            <>
              <DropdownMenuLinkItem href={`${LISTINGS_PATH}/${listing.id}/edit`}>
                Edit
              </DropdownMenuLinkItem>
              <DropdownMenuItem onClick={toggleStatus}>
                {isOpen ? "Close" : "Reopen"}
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                disabled={hasApplications}
                onClick={() => setConfirmOpen(true)}
              >
                Delete
              </DropdownMenuItem>
              {hasApplications && (
                <p className="px-2.5 pt-1 pb-1.5 text-xs text-muted-foreground">
                  {HAS_APPLICATIONS_MESSAGE}
                </p>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete this listing?</AlertDialogTitle>
          <AlertDialogDescription>
            {`"${listing.title}" will be deleted for good. This cannot be undone.`}
          </AlertDialogDescription>
          <div className="flex justify-end gap-2">
            <AlertDialogClose className={buttonVariants({ variant: "outline", size: "lg" })}>
              Cancel
            </AlertDialogClose>
            <Button
              type="button"
              variant="destructive"
              size="lg"
              disabled={deleteListing.isPending}
              onClick={confirmDelete}
            >
              {deleteListing.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
