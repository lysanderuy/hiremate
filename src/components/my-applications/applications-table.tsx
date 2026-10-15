"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";

import { ApplicationRowMenu } from "@/components/my-applications/application-row-menu";
import { DataTable, Td, Th } from "@/components/shared/data-table";
import { ScoreCell } from "@/components/shared/match-score";
import { ApplicationStatusPill } from "@/components/shared/status-pill";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMyApplications } from "@/hooks/use-my-applications";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  APPLICANT_APPLICATION_STATUSES,
  APPLICATION_STATUS_LABELS,
  type ApplicantApplicationStatus,
} from "@/types/applications";
import type { MyApplicationSummaryResponse } from "@/validators/application.validator";

const APPLICATIONS_PATH = "/dashboard/applicant/applications";
const JOBS_PATH = "/dashboard/applicant/jobs";

type StatusFilter = ApplicantApplicationStatus | undefined;

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: undefined, label: "All" },
  ...APPLICANT_APPLICATION_STATUSES.map((value) => ({
    value,
    label: APPLICATION_STATUS_LABELS[value],
  })),
];

function parseStatus(value: string | null): StatusFilter {
  return APPLICANT_APPLICATION_STATUSES.find((status) => status === value);
}

function ApplicationRow({
  application,
  onError,
}: {
  application: MyApplicationSummaryResponse;
  onError: (message: string | null) => void;
}) {
  return (
    <tr className="relative transition-colors focus-within:bg-primary-soft/30 hover:bg-primary-soft/30">
      <Td>
        <Link
          href={`${APPLICATIONS_PATH}/${application.id}`}
          className="block font-semibold break-words text-ink outline-none after:absolute after:inset-0 hover:text-primary focus-visible:after:outline-3 focus-visible:after:-outline-offset-2 focus-visible:after:outline-primary"
        >
          {application.jobTitle}
        </Link>
        <small className="block text-xs text-muted-foreground">
          {application.companyName} &middot; {application.location}
          {application.jobStatus !== "open" && <> &middot; Listing closed</>}
        </small>
      </Td>
      <Td>
        <ApplicationStatusPill status={application.status} />
      </Td>
      <Td className="whitespace-nowrap">
        <ScoreCell score={application.matchScore} band={application.band} />
      </Td>
      <Td className="whitespace-nowrap max-sm:hidden">{formatDate(application.createdAt)}</Td>
      <Td className="whitespace-nowrap max-sm:hidden">{formatDate(application.statusChangedAt)}</Td>
      <Td className="relative z-10 w-px text-right">
        <ApplicationRowMenu application={application} onError={onError} />
      </Td>
    </tr>
  );
}

function EmptyState({ status }: { status: StatusFilter }) {
  return (
    <div className="px-5 py-12 text-center">
      <h3 className="mb-2 text-base font-semibold">
        {status === undefined
          ? "No applications yet."
          : `No ${APPLICATION_STATUS_LABELS[status].toLowerCase()} applications`}
      </h3>
      <p className="mb-4">
        {status === undefined
          ? "Browse jobs to find a fit."
          : "Applications with this status show up here."}
      </p>
      <Link href={JOBS_PATH} className={buttonVariants({ size: "sm" })}>
        <Search aria-hidden="true" />
        Browse jobs
      </Link>
    </div>
  );
}

export function ApplicationsTable() {
  const pathname = usePathname();
  const status = parseStatus(useSearchParams().get("status"));
  const { data, isPending, error } = useMyApplications();
  const [actionError, setActionError] = useState<string | null>(null);

  function selectStatus(next: StatusFilter) {
    window.history.replaceState(null, "", next ? `${pathname}?status=${next}` : pathname);
  }

  if (isPending) {
    return (
      <div role="status" aria-label="Loading applications">
        <div className="h-72 animate-pulse rounded-xl border border-line bg-white" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <p role="alert" className="rounded-md bg-error-soft px-4 py-3 text-error">
        {error?.message ?? "Could not load your applications."}
      </p>
    );
  }

  const rows = data.items.filter((item) => status === undefined || item.status === status);

  return (
    <div>
      <div role="group" aria-label="Filter by status" className="mb-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => {
          const pressed = filter.value === status;
          return (
            <button
              key={filter.label}
              type="button"
              aria-pressed={pressed}
              onClick={() => selectStatus(filter.value)}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors",
                pressed
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-line bg-white hover:border-muted-foreground",
              )}
            >
              {filter.label}
              <small
                className={cn("font-medium", pressed ? "text-primary" : "text-muted-foreground")}
              >
                {data.counts[filter.value ?? "all"]}
              </small>
            </button>
          );
        })}
      </div>

      {actionError && (
        <p role="alert" className="mb-4 rounded-md bg-error-soft px-4 py-3 text-error">
          {actionError}
        </p>
      )}

      <Card className="gap-0 py-0">
        {rows.length === 0 ? (
          <EmptyState status={status} />
        ) : (
          <DataTable label="My applications">
            <thead>
              <tr>
                <Th>Job</Th>
                <Th>Status</Th>
                <Th>Score when applied</Th>
                <Th className="max-sm:hidden">Applied</Th>
                <Th className="max-sm:hidden">Last update</Th>
                <Th>
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((application) => (
                <ApplicationRow
                  key={application.id}
                  application={application}
                  onError={setActionError}
                />
              ))}
            </tbody>
          </DataTable>
        )}
      </Card>
    </div>
  );
}
