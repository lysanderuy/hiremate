"use client";

import { ReasonDialog } from "@/components/admin/reason-dialog";
import { useRemoveListing } from "@/hooks/use-remove-listing";
import { useToastStore } from "@/stores/toast.store";
import { MAX_REMOVAL_REASON } from "@/validators/admin-listing.validator";

export function RemoveListingDialog({
  listingId,
  onClose,
}: {
  listingId: string | null;
  onClose: () => void;
}) {
  const remove = useRemoveListing();
  const showToast = useToastStore((state) => state.show);

  function handleConfirm(reason: string) {
    if (!listingId) return;
    remove.mutate(
      { id: listingId, reason },
      {
        onSuccess: () => {
          showToast("Listing removed.");
          onClose();
        },
      },
    );
  }

  return (
    <ReasonDialog
      key={listingId ?? "none"}
      open={listingId !== null}
      onOpenChange={(open) => !open && onClose()}
      title="Remove this listing?"
      description="It leaves Jobs and applicants can no longer apply. Existing applications stay visible to applicants and the recruiter."
      placeholder="For example, this listing is a duplicate."
      help="The recruiter sees this reason and cannot reopen the listing."
      confirmLabel="Remove listing"
      maxLength={MAX_REMOVAL_REASON}
      pending={remove.isPending}
      error={remove.error?.message ?? null}
      onConfirm={handleConfirm}
    />
  );
}
