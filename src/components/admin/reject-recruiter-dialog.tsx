"use client";

import { ReasonDialog } from "@/components/admin/reason-dialog";
import { useRejectRecruiter } from "@/hooks/use-reject-recruiter";
import { useToastStore } from "@/stores/toast.store";
import { MAX_REJECTION_REASON } from "@/validators/approval.validator";

export type RejectTarget = { id: string; name: string };

export function RejectRecruiterDialog({
  target,
  onClose,
}: {
  target: RejectTarget | null;
  onClose: () => void;
}) {
  const reject = useRejectRecruiter();
  const showToast = useToastStore((state) => state.show);

  function handleConfirm(reason: string) {
    if (!target) return;
    reject.mutate(
      { id: target.id, reason },
      {
        onSuccess: () => {
          showToast(`${target.name} rejected.`);
          onClose();
        },
      },
    );
  }

  return (
    <ReasonDialog
      key={target?.id ?? "none"}
      open={target !== null}
      onOpenChange={(open) => !open && onClose()}
      title={`Reject ${target?.name ?? ""}?`}
      description="They can still log in, see your reason and ask for another review. This does not delete the account."
      placeholder="For example, the company name could not be matched."
      help="The recruiter sees this reason."
      confirmLabel="Reject recruiter"
      maxLength={MAX_REJECTION_REASON}
      pending={reject.isPending}
      error={reject.error?.message ?? null}
      onConfirm={handleConfirm}
    />
  );
}
