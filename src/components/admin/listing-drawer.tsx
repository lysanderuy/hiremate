"use client";

import { XIcon } from "lucide-react";
import { useState } from "react";

import { ListingStatusPill } from "@/components/admin/admin-status";
import { DrawerNote, DrawerSection, KeyValueList } from "@/components/admin/drawer-parts";
import { RemoveListingDialog } from "@/components/admin/remove-listing-dialog";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useAdminListing } from "@/hooks/use-admin-listing";
import { useRestoreListing } from "@/hooks/use-restore-listing";
import { formatDate, formatSalaryRange } from "@/lib/format";
import { useToastStore } from "@/stores/toast.store";
import { EMPLOYMENT_TYPE_LABELS } from "@/types/jobs";

export const RESTORED_MESSAGE = "Listing restored as Closed. The recruiter can reopen it.";

export function ListingDrawer({
  listingId,
  onClose,
}: {
  listingId: string | null;
  onClose: () => void;
}) {
  const detail = useAdminListing(listingId);
  const restore = useRestoreListing();
  const showToast = useToastStore((state) => state.show);
  const [removing, setRemoving] = useState(false);

  const listing = detail.data;

  function handleRestore() {
    if (!listing) return;
    restore.mutate(listing.id, {
      onSuccess: () => showToast(RESTORED_MESSAGE),
      onError: (error) => showToast(error.message),
    });
  }

  // Sheet must stay open while the removal dialog on top of it is open.
  function handleOpenChange(open: boolean) {
    if (!open && !removing) onClose();
  }

  return (
    <>
      <Sheet open={listingId !== null} onOpenChange={handleOpenChange}>
        <SheetContent
          showCloseButton={false}
          className="gap-0 p-0 text-base data-[side=right]:w-full data-[side=right]:sm:max-w-120"
        >
          <div className="flex items-start gap-4 border-b border-line p-5">
            <div className="min-w-0 flex-1">
              <SheetTitle className="mb-1.5 text-[1.375rem] break-words">
                {listing ? listing.title : "Loading listing"}
              </SheetTitle>
              {listing && (
                <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                  <span className="break-words">{listing.companyName}</span>
                  <ListingStatusPill status={listing.status} />
                </div>
              )}
            </div>
            <SheetClose
              aria-label="Close details"
              className="flex size-10 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-page hover:text-ink"
            >
              <XIcon className="size-5" />
            </SheetClose>
          </div>

          <div className="grid flex-1 content-start gap-5 overflow-auto p-5">
            {detail.error ? (
              <p role="alert" className="rounded-md bg-error-soft px-4 py-3 text-error">
                {detail.error.message}
              </p>
            ) : !listing ? (
              <div
                role="status"
                aria-label="Loading listing"
                className="h-40 animate-pulse rounded-xl bg-page"
              />
            ) : (
              <>
                {listing.status === "removed" && (
                  <DrawerNote>
                    <b className="font-semibold text-ink">Removed by an administrator.</b>{" "}
                    {listing.removalReason ?? "No reason given."}
                  </DrawerNote>
                )}
                {listing.hidden && (
                  <DrawerNote>
                    Hidden from Jobs because the recruiter account is not active. The listing stays
                    Open.
                  </DrawerNote>
                )}
                {!listing.matchReady && (
                  <DrawerNote>
                    Preparing. Match scores are not available for this listing yet.
                  </DrawerNote>
                )}

                <DrawerSection title="Details">
                  <KeyValueList
                    label="Details"
                    items={[
                      ["Recruiter", listing.recruiterName],
                      ["Location", listing.location],
                      ["Type", EMPLOYMENT_TYPE_LABELS[listing.employmentType]],
                      ["Pay", formatSalaryRange(listing.salaryMin, listing.salaryMax)],
                      ["Created", formatDate(listing.createdAt)],
                      ["Applications", listing.applicationCount],
                    ]}
                  />
                </DrawerSection>

                <DrawerSection title="Skills">
                  {listing.skills.length === 0 ? (
                    <p className="text-muted-foreground">No skills listed.</p>
                  ) : (
                    <ul className="flex flex-wrap gap-2">
                      {listing.skills.map((skill) => (
                        <li
                          key={skill}
                          className="inline-flex h-7 items-center rounded-full bg-primary-soft px-3 text-chip font-medium text-primary"
                        >
                          {skill}
                        </li>
                      ))}
                    </ul>
                  )}
                </DrawerSection>

                <DrawerSection title="Description">
                  <p className="leading-[1.7] break-words whitespace-pre-line">
                    {listing.description}
                  </p>
                </DrawerSection>

                <p className="text-chip text-muted-foreground">
                  Applicant details are private. Administrators see the number of applications only.
                </p>
              </>
            )}
          </div>

          {listing && (
            <div className="flex flex-wrap justify-end gap-3 border-t border-line px-5 py-4">
              {listing.status === "removed" ? (
                <Button type="button" disabled={restore.isPending} onClick={handleRestore}>
                  Restore
                </Button>
              ) : (
                <Button type="button" variant="outline" onClick={() => setRemoving(true)}>
                  Remove
                </Button>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      <RemoveListingDialog
        listingId={removing && listing ? listing.id : null}
        onClose={() => setRemoving(false)}
      />
    </>
  );
}
