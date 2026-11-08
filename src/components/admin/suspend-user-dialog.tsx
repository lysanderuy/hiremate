"use client";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useAdminUser } from "@/hooks/use-admin-user";
import { useSuspendUser } from "@/hooks/use-suspend-user";
import { useToastStore } from "@/stores/toast.store";
import type { AppRole } from "@/types/roles";

export type SuspendTarget = { id: string; name: string; role: AppRole };

export function SuspendUserDialog({
  target,
  onClose,
}: {
  target: SuspendTarget | null;
  onClose: () => void;
}) {
  const suspend = useSuspendUser();
  const showToast = useToastStore((state) => state.show);
  const detail = useAdminUser(target?.role === "recruiter" ? target.id : null);
  const hasOpenListings = (detail.data?.openListingCount ?? 0) > 0;

  const description = hasOpenListings
    ? "They are logged out on their next request and cannot log in. Their open listings are hidden from Jobs until you reactivate them."
    : "They are logged out on their next request and cannot log in.";

  function handleConfirm() {
    if (!target) return;
    suspend.mutate(target.id, {
      onSuccess: () => showToast(`${target.name} suspended.`),
      onError: (error) => showToast(error.message),
      onSettled: onClose,
    });
  }

  return (
    <ConfirmDialog
      open={target !== null}
      onOpenChange={(open) => !open && onClose()}
      title={`Suspend ${target?.name ?? ""}?`}
      description={description}
      confirmLabel="Suspend"
      danger
      pending={suspend.isPending}
      onConfirm={handleConfirm}
    />
  );
}
