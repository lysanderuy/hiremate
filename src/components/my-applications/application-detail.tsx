"use client";

import { ArrowLeft, Briefcase } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { WithdrawDialog } from "@/components/my-applications/withdraw-dialog";
import { MatchAnalysis } from "@/components/shared/match-analysis";
import { CRUMB_CLASS } from "@/components/shared/page-header";
import { ApplicationStatusPill } from "@/components/shared/status-pill";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMyApplication } from "@/hooks/use-my-application";
import { ApiError } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  APPLICATION_STATUS_LABELS,
  canWithdraw,
  type ApplicantApplicationStatus,
} from "@/types/applications";
import { EMPLOYMENT_TYPE_LABELS } from "@/types/jobs";
import type { MyApplicationDetailResponse } from "@/validators/application.validator";

const APPLICATIONS_PATH = "/dashboard/applicant/applications";
const JOBS_PATH = "/dashboard/applicant/jobs";
const CARD_CLASS = "gap-0 p-5 min-[641px]:p-6";
const CARD_TITLE_CLASS = "mb-3 text-base font-semibold tracking-[-0.01em]";

const STATUS_MEANING: Record<ApplicantApplicationStatus, string> = {
  submitted: "The recruiter has not opened your application yet.",
  viewed: "The recruiter opened your application.",
  shortlisted: "The recruiter shortlisted you. They decide the next step.",
  rejected: "The recruiter did not move forward with this application.",
  withdrawn: "You withdrew this application. You can apply again while the listing is open.",
};

type TimelineStep = {
  label: string;
  detail: string;
  tone: "done" | "bad" | "off" | "pending";
};

const DOT_TONES: Record<TimelineStep["tone"], string> = {
  done: "border-primary bg-primary",
  bad: "border-error bg-error",
  off: "border-muted-foreground bg-muted-foreground",
  pending: "border-line-dashed bg-white",
};

function buildTimeline(application: MyApplicationDetailResponse): TimelineStep[] {
  const decided = formatDate(application.statusChangedAt);
  let decision: TimelineStep;
  switch (application.status) {
    case "shortlisted":
      decision = { label: "Shortlisted", detail: decided, tone: "done" };
      break;
    case "rejected":
      decision = { label: "Rejected", detail: decided, tone: "bad" };
      break;
    case "withdrawn":
      decision = { label: "Withdrawn", detail: decided, tone: "off" };
      break;
    default:
      decision = {
        label: "Waiting for a decision",
        detail: "The recruiter decides",
        tone: "pending",
      };
  }

  return [
    { label: "Submitted", detail: formatDate(application.createdAt), tone: "done" },
    application.viewedAt
      ? { label: "Viewed", detail: formatDate(application.viewedAt), tone: "done" }
      : { label: "Viewed", detail: "Not yet", tone: "pending" },
    decision,
  ];
}

function StatusTimeline({ application }: { application: MyApplicationDetailResponse }) {
  const steps = buildTimeline(application);

  return (
    <Card className={CARD_CLASS}>
      <h2 className="mb-4 text-base font-semibold">Status</h2>
      <ol className="grid">
        {steps.map((step, index) => (
          <li key={step.label} className="relative pb-5 pl-7 last:pb-0">
            {index < steps.length - 1 && (
              <span aria-hidden="true" className="absolute top-4 bottom-0 left-1.75 w-px bg-line" />
            )}
            <span
              aria-hidden="true"
              className={cn(
                "absolute top-1 left-0 size-4 rounded-full border-2",
                DOT_TONES[step.tone],
              )}
            />
            <b className="block font-semibold text-ink">{step.label}</b>
            <span className="text-sm text-muted-foreground">{step.detail}</span>
          </li>
        ))}
      </ol>
      <p className="mt-5 border-t border-line pt-4 text-xs text-muted-foreground">
        {STATUS_MEANING[application.status]}
      </p>
    </Card>
  );
}

function BackLink() {
  return (
    <Link href={APPLICATIONS_PATH} className={CRUMB_CLASS}>
      <ArrowLeft aria-hidden="true" className="size-4.5" />
      My applications
    </Link>
  );
}

export function ApplicationDetail({ id }: { id: string }) {
  const { data: application, isPending, error } = useMyApplication(id);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (isPending) {
    return (
      <>
        <BackLink />
        <div
          role="status"
          aria-label="Loading application"
          className="h-64 animate-pulse rounded-xl border border-line bg-white"
        />
      </>
    );
  }

  if (error instanceof ApiError && error.status === 404) {
    return (
      <>
        <BackLink />
        <Card className="gap-0 py-0">
          <div className="px-5 py-12 text-center">
            <h2 className="mb-4 text-base font-semibold">Application not found</h2>
            <Link
              href={APPLICATIONS_PATH}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Back to applications
            </Link>
          </div>
        </Card>
      </>
    );
  }

  if (error || !application) {
    return (
      <>
        <BackLink />
        <p role="alert" className="rounded-md bg-error-soft px-4 py-3 text-error">
          {error?.message ?? "Could not load this application."}
        </p>
      </>
    );
  }

  const withdrawable = canWithdraw(application.status);
  const match =
    application.matchScore !== null && application.band !== null
      ? {
          score: application.matchScore,
          band: application.band,
          breakdown: application.matchBreakdown,
        }
      : null;
  const skillsMatch =
    application.skillsMatched.length + application.skillsMissing.length > 0
      ? { matched: application.skillsMatched, missing: application.skillsMissing }
      : null;

  return (
    <>
      <BackLink />
      <Card className={cn(CARD_CLASS, "mb-5")}>
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-semibold break-words sm:text-2xl">
                {application.jobTitle}
              </h1>
              <ApplicationStatusPill status={application.status} />
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-muted-foreground">
              <span>{application.companyName}</span>
              <span>{application.location}</span>
              <span>{EMPLOYMENT_TYPE_LABELS[application.employmentType]}</span>
              <span>Applied {formatDate(application.createdAt)}</span>
              {application.jobStatus !== "open" && <span>Listing closed</span>}
            </div>
          </div>
          <div className="grid gap-2 sm:justify-items-end">
            <div className="flex flex-wrap gap-2">
              <Link
                href={`${JOBS_PATH}/${application.jobId}`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                <Briefcase aria-hidden="true" />
                View job
              </Link>
              <Button
                variant="outline"
                size="sm"
                disabled={!withdrawable}
                onClick={() => setWithdrawOpen(true)}
                className={cn(withdrawable && "text-error-strong")}
              >
                Withdraw
              </Button>
            </div>
            {!withdrawable && (
              <p className="text-xs text-muted-foreground">
                Not available for {APPLICATION_STATUS_LABELS[application.status]}.
              </p>
            )}
          </div>
        </div>
        {actionError && (
          <p role="alert" className="mt-4 rounded-md bg-error-soft px-4 py-3 text-error">
            {actionError}
          </p>
        )}
      </Card>

      <div className="grid items-start gap-5 min-[1100px]:grid-cols-[minmax(0,1fr)_21.25rem]">
        <div className="grid min-w-0 gap-5">
          <MatchAnalysis
            audience="applicant"
            match={match}
            skills={skillsMatch}
            fallback={
              <p className="font-medium text-ink">No score was saved for this application.</p>
            }
          />
          <Card className={CARD_CLASS}>
            <h2 className={CARD_TITLE_CLASS}>Resume you sent</h2>
            <a
              href={`/api/applications/me/${application.id}/file`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "default", size: "sm" })}
            >
              Open resume (PDF)
            </a>
          </Card>
        </div>

        <div className="min-[1100px]:sticky min-[1100px]:top-6">
          <StatusTimeline application={application} />
        </div>
      </div>

      <WithdrawDialog
        applicationId={application.id}
        jobTitle={application.jobTitle}
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        onError={setActionError}
      />
    </>
  );
}
