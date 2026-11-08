"use client";

import { XIcon } from "lucide-react";
import { useState } from "react";

import {
  AccountStatusPill,
  ROLE_LABELS,
  reactivationMessage,
} from "@/components/admin/admin-status";
import { DrawerNote, DrawerSection, KeyValueList } from "@/components/admin/drawer-parts";
import { RejectRecruiterDialog } from "@/components/admin/reject-recruiter-dialog";
import { SuspendUserDialog } from "@/components/admin/suspend-user-dialog";
import { Avatar } from "@/components/shared/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useAdminUser } from "@/hooks/use-admin-user";
import { useApproveRecruiter } from "@/hooks/use-approve-recruiter";
import { useProfile } from "@/hooks/use-profile";
import { useReactivateUser } from "@/hooks/use-reactivate-user";
import { formatDate } from "@/lib/format";
import { useToastStore } from "@/stores/toast.store";
import type { AdminUserDetailResponse } from "@/validators/admin-user.validator";

const RESUME_LABELS: Record<NonNullable<AdminUserDetailResponse["resumeState"]>, string> = {
  ready: "Ready",
  failed: "Failed to process",
  none: "None",
};

export function UserDrawer({ userId, onClose }: { userId: string | null; onClose: () => void }) {
  const detail = useAdminUser(userId);
  const profile = useProfile();
  const approve = useApproveRecruiter();
  const reactivate = useReactivateUser();
  const showToast = useToastStore((state) => state.show);
  const [rejecting, setRejecting] = useState(false);
  const [suspending, setSuspending] = useState(false);

  const user = detail.data;
  const name = user ? (user.displayName ?? user.email) : "";
  const canSuspend = user?.role !== "administrator" && user?.id !== profile.data?.id;
  const busy = approve.isPending || reactivate.isPending;

  function handleApprove() {
    if (!user) return;
    approve.mutate(user.id, {
      onSuccess: () => showToast(`${name} approved. They can post listings now.`),
      onError: (error) => showToast(error.message),
    });
  }

  function handleReactivate() {
    if (!user) return;
    reactivate.mutate(user.id, {
      onSuccess: (result) => showToast(reactivationMessage(name, result.accountStatus)),
      onError: (error) => showToast(error.message),
    });
  }

  // Sheet must stay open while a confirmation dialog on top of it is open.
  function handleOpenChange(open: boolean) {
    if (!open && !rejecting && !suspending) onClose();
  }

  return (
    <>
      <Sheet open={userId !== null} onOpenChange={handleOpenChange}>
        <SheetContent
          showCloseButton={false}
          className="gap-0 p-0 text-base data-[side=right]:w-full data-[side=right]:sm:max-w-120"
        >
          <div className="flex items-start gap-4 border-b border-line p-5">
            {user && <Avatar name={name} className="size-14 text-lg" />}
            <div className="min-w-0 flex-1">
              <SheetTitle className="mb-1.5 text-[1.375rem] break-words">
                {user ? name : "Loading user"}
              </SheetTitle>
              {user && (
                <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
                  <span>{ROLE_LABELS[user.role]}</span>
                  <AccountStatusPill status={user.accountStatus} />
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
            ) : !user ? (
              <div
                role="status"
                aria-label="Loading user"
                className="h-40 animate-pulse rounded-xl bg-page"
              />
            ) : (
              <>
                <DrawerSection title="Account">
                  <KeyValueList
                    label="Account"
                    items={[
                      ["Email", user.email],
                      ["Role", ROLE_LABELS[user.role]],
                      ["Signed up", formatDate(user.createdAt)],
                    ]}
                  />
                </DrawerSection>

                {user.role === "recruiter" && (
                  <DrawerSection title="Company">
                    <KeyValueList
                      label="Company"
                      items={[
                        ["Company", user.companyName ?? "Not set"],
                        ["Job title", user.jobTitle ?? "Not set"],
                        [
                          "Approved",
                          user.approvedAt ? formatDate(user.approvedAt) : "Not approved yet",
                        ],
                        [
                          "Listings",
                          `${user.listingCount ?? 0} (${user.openListingCount ?? 0} open)`,
                        ],
                      ]}
                    />
                  </DrawerSection>
                )}

                {user.role === "applicant" && (
                  <DrawerSection title="Activity">
                    <KeyValueList
                      label="Activity"
                      items={[
                        ["Applications", user.applicationCount ?? 0],
                        ["Resume", user.resumeState ? RESUME_LABELS[user.resumeState] : "None"],
                      ]}
                    />
                  </DrawerSection>
                )}

                {user.accountStatus === "rejected" && (
                  <DrawerSection title="Rejection reason">
                    <DrawerNote>{user.rejectionReason ?? "No reason given."}</DrawerNote>
                    <p className="mt-2 text-chip text-muted-foreground">
                      The recruiter can ask for another review. They return to Approvals when they
                      do.
                    </p>
                  </DrawerSection>
                )}

                {user.accountStatus === "suspended" && user.role === "recruiter" && (
                  <DrawerNote>
                    Their open listings are hidden from Jobs. They return when you reactivate this
                    account.
                  </DrawerNote>
                )}

                <p className="text-chip text-muted-foreground">
                  Resumes and application contents are private. Administrators cannot open them.
                </p>
              </>
            )}
          </div>

          {user && (
            <DrawerFooter
              status={user.accountStatus}
              canSuspend={canSuspend}
              busy={busy}
              onApprove={handleApprove}
              onReject={() => setRejecting(true)}
              onSuspend={() => setSuspending(true)}
              onReactivate={handleReactivate}
            />
          )}
        </SheetContent>
      </Sheet>

      <RejectRecruiterDialog
        target={rejecting && user ? { id: user.id, name } : null}
        onClose={() => setRejecting(false)}
      />
      <SuspendUserDialog
        target={suspending && user ? { id: user.id, name, role: user.role } : null}
        onClose={() => setSuspending(false)}
      />
    </>
  );
}

type DrawerFooterProps = {
  status: AdminUserDetailResponse["accountStatus"];
  canSuspend: boolean;
  busy: boolean;
  onApprove: () => void;
  onReject: () => void;
  onSuspend: () => void;
  onReactivate: () => void;
};

function DrawerFooter({
  status,
  canSuspend,
  busy,
  onApprove,
  onReject,
  onSuspend,
  onReactivate,
}: DrawerFooterProps) {
  if (status === "pending") {
    return (
      <FooterBar>
        <Button type="button" variant="outline" disabled={busy} onClick={onReject}>
          Reject
        </Button>
        <Button type="button" disabled={busy} onClick={onApprove}>
          Approve
        </Button>
      </FooterBar>
    );
  }
  if (status === "active" && canSuspend) {
    return (
      <FooterBar>
        <Button type="button" variant="outline" disabled={busy} onClick={onSuspend}>
          Suspend
        </Button>
      </FooterBar>
    );
  }
  if (status === "suspended") {
    return (
      <FooterBar>
        <Button type="button" disabled={busy} onClick={onReactivate}>
          Reactivate
        </Button>
      </FooterBar>
    );
  }
  return null;
}

function FooterBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap justify-end gap-3 border-t border-line px-5 py-4">
      {children}
    </div>
  );
}
