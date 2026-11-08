"use client";

import { useState } from "react";

import {
  RejectRecruiterDialog,
  type RejectTarget,
} from "@/components/admin/reject-recruiter-dialog";
import { UserDrawer } from "@/components/admin/user-drawer";
import { Avatar } from "@/components/shared/avatar";
import { ClickableRow } from "@/components/shared/clickable-row";
import { DataTable, Td, Th } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useApprovals } from "@/hooks/use-approvals";
import { useApproveRecruiter } from "@/hooks/use-approve-recruiter";
import { formatDate } from "@/lib/format";
import { useToastStore } from "@/stores/toast.store";

export function ApprovalsView() {
  const { data, isPending, error } = useApprovals();
  const approve = useApproveRecruiter();
  const showToast = useToastStore((state) => state.show);
  const [rejecting, setRejecting] = useState<RejectTarget | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (isPending) {
    return (
      <div role="status" aria-label="Loading approvals">
        <div className="h-72 animate-pulse rounded-xl border border-line bg-white" />
      </div>
    );
  }

  if (error) {
    return (
      <p role="alert" className="rounded-md bg-error-soft px-4 py-3 text-error">
        {error.message}
      </p>
    );
  }

  function handleApprove(id: string, name: string) {
    approve.mutate(id, {
      onSuccess: () => showToast(`${name} approved. They can post listings now.`),
      onError: (mutationError) => showToast(mutationError.message),
    });
  }

  return (
    <>
      <Card className="gap-0 py-0">
        {data.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <h3 className="mb-2 font-display text-lg font-semibold text-ink">
              No recruiters waiting
            </h3>
            <p>New recruiter sign ups show up here for review.</p>
          </div>
        ) : (
          <DataTable label="Recruiters waiting for approval">
            <thead>
              <tr>
                <Th>Recruiter</Th>
                <Th className="max-sm:hidden">Job title</Th>
                <Th>Company</Th>
                <Th className="max-sm:hidden">Signed up</Th>
                <Th>
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {data.map((recruiter) => {
                const name = recruiter.displayName ?? recruiter.email;
                const busy = approve.isPending && approve.variables === recruiter.id;
                return (
                  <ClickableRow key={recruiter.id} onActivate={() => setSelectedId(recruiter.id)}>
                    <Td className="h-18">
                      <div className="flex items-center gap-3">
                        <Avatar name={name} />
                        <div className="min-w-0">
                          <span className="block font-semibold break-words text-ink">{name}</span>
                          <small className="block max-w-65 truncate text-chip text-muted-foreground">
                            {recruiter.email}
                          </small>
                        </div>
                      </div>
                    </Td>
                    <Td className="h-18 max-sm:hidden">
                      {recruiter.jobTitle ?? <span className="text-muted-foreground">Not set</span>}
                    </Td>
                    <Td className="h-18">
                      {recruiter.companyName ?? (
                        <span className="text-muted-foreground">Not set</span>
                      )}
                    </Td>
                    <Td className="h-18 whitespace-nowrap max-sm:hidden">
                      {formatDate(recruiter.createdAt)}
                    </Td>
                    <Td className="h-18">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          disabled={busy}
                          onClick={() => handleApprove(recruiter.id, name)}
                        >
                          Approve
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => setRejecting({ id: recruiter.id, name })}
                        >
                          Reject
                        </Button>
                      </div>
                    </Td>
                  </ClickableRow>
                );
              })}
            </tbody>
          </DataTable>
        )}
      </Card>

      <RejectRecruiterDialog target={rejecting} onClose={() => setRejecting(null)} />
      <UserDrawer userId={selectedId} onClose={() => setSelectedId(null)} />
    </>
  );
}
