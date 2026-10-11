"use client";

import { Briefcase, Eye, MoreHorizontal, X } from "lucide-react";
import { useState } from "react";

import { WithdrawDialog } from "@/components/my-applications/withdraw-dialog";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { APPLICATION_STATUS_LABELS, canWithdraw } from "@/types/applications";
import type { MyApplicationSummaryResponse } from "@/validators/application.validator";

const APPLICATIONS_PATH = "/dashboard/applicant/applications";
const JOBS_PATH = "/dashboard/applicant/jobs";

type ApplicationRowMenuProps = {
  application: MyApplicationSummaryResponse;
  onError: (message: string | null) => void;
};

export function ApplicationRowMenu({ application, onError }: ApplicationRowMenuProps) {
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const withdrawable = canWithdraw(application.status);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Actions for ${application.jobTitle}`}
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon-sm" }),
            "text-muted-foreground hover:text-ink",
          )}
        >
          <MoreHorizontal aria-hidden="true" className="size-5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLinkItem href={`${APPLICATIONS_PATH}/${application.id}`}>
            <Eye aria-hidden="true" />
            View application
          </DropdownMenuLinkItem>
          <DropdownMenuLinkItem href={`${JOBS_PATH}/${application.jobId}`}>
            <Briefcase aria-hidden="true" />
            View job
          </DropdownMenuLinkItem>
          <DropdownMenuItem
            variant="destructive"
            disabled={!withdrawable}
            onClick={() => setWithdrawOpen(true)}
            className={cn(!withdrawable && "items-start")}
          >
            <X aria-hidden="true" className={cn(!withdrawable && "mt-0.5")} />
            <span>
              Withdraw
              {!withdrawable && (
                <small className="block text-xs font-normal text-muted-foreground">
                  Not available for {APPLICATION_STATUS_LABELS[application.status]}
                </small>
              )}
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <WithdrawDialog
        applicationId={application.id}
        jobTitle={application.jobTitle}
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        onError={onError}
      />
    </>
  );
}
