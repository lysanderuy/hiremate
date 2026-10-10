"use client";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useWithdrawApplication } from "@/hooks/use-withdraw-application";
import type { ApplicantApplicationStatus } from "@/types/applications";

const WITHDRAWABLE: readonly ApplicantApplicationStatus[] = ["submitted", "viewed", "shortlisted"];

export function canWithdraw(status: ApplicantApplicationStatus): boolean {
  return WITHDRAWABLE.includes(status);
}

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
      description={`This cannot be undone, and you cannot apply to ${jobTitle} again.`}
      confirmLabel={withdraw.isPending ? "Withdrawing..." : "Withdraw"}
      danger
      pending={withdraw.isPending}
      onConfirm={confirm}
    />
  );
}
