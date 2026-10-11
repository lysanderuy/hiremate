"use client";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useWithdrawApplication } from "@/hooks/use-withdraw-application";

type WithdrawDialogProps = {
  applicationId: string;
  jobTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onError: (message: string | null) => void;
};

export function WithdrawDialog({
  applicationId,
  jobTitle,
  open,
  onOpenChange,
  onError,
}: WithdrawDialogProps) {
  const withdraw = useWithdrawApplication();

  function confirm() {
    onError(null);
    withdraw.mutate(applicationId, {
      onError: (error) => onError(error.message),
      onSettled: () => onOpenChange(false),
    });
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Withdraw this application?"
      description={`This cannot be undone. You can apply to ${jobTitle} again while the listing is open.`}
      confirmLabel={withdraw.isPending ? "Withdrawing..." : "Withdraw"}
      danger
      pending={withdraw.isPending}
      onConfirm={confirm}
    />
  );
}
