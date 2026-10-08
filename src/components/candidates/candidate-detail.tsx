"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Mail } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { ApplicationStatusBadge } from "@/components/candidates/application-status-badge";
import { useApplication } from "@/hooks/use-application";
import { applicationKeys } from "@/hooks/use-applications";
import { useUpdateApplicationStatus } from "@/hooks/use-update-application-status";
import { ApiError } from "@/lib/api/client";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { APPLICATION_STATUS_LABELS } from "@/types/applications";
import {
  RECRUITER_SETTABLE_STATUSES,
  type ApplicationDetailResponse,
} from "@/validators/application.validator";

const CANDIDATES_PATH = "/dashboard/recruiter/candidates";
const cardClassName = "rounded-xl border border-border bg-white p-4 sm:p-6";
const MATCHED_CHIP =
  "inline-flex min-h-8 items-center rounded-full bg-tint px-3 text-sm text-primary";
const MISSING_CHIP =
  "inline-flex min-h-8 items-center rounded-full bg-slate-100 px-3 text-sm text-slate-600";

function BackLink({ listingId }: { listingId?: string }) {
  const query = useSearchParams().toString();
  const fallback = listingId ? `${CANDIDATES_PATH}?listing=${listingId}` : CANDIDATES_PATH;
  return (
    <Link
      href={query ? `${CANDIDATES_PATH}?${query}` : fallback}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-navy"
    >
      <ArrowLeft className="size-4" />
      Candidates
    </Link>
  );
}

function getInitials(name: string | null): string {
  const letters = (name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
  return letters || "?";
}

function SkillGroup({
  title,
  skills,
  chipClassName,
}: {
  title: string;
  skills: string[];
  chipClassName: string;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-navy">
        {title} ({skills.length})
      </h3>
      {skills.length === 0 ? (
        <p className="text-sm text-muted-foreground">None.</p>
      ) : (
        <ul className="flex flex-wrap gap-2" aria-label={title}>
          {skills.map((skill) => (
            <li key={skill} className={cn(chipClassName, "break-all")}>
              {skill}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusCard({ application }: { application: ApplicationDetailResponse }) {
  const updateStatus = useUpdateApplicationStatus();

  return (
    <section className={cn(cardClassName, "space-y-4")}>
      <h2 className="text-base font-semibold text-navy">Status</h2>
      {application.status === "withdrawn" ? (
        <p role="status" className="text-sm text-muted-foreground">
          The applicant withdrew this application.
        </p>
      ) : (
        <div role="group" aria-label="Application status" className="space-y-2">
          {RECRUITER_SETTABLE_STATUSES.map((status) => {
            const selected = application.status === status;
            return (
              <button
                key={status}
                type="button"
                aria-pressed={selected}
                disabled={updateStatus.isPending}
                onClick={() => updateStatus.mutate({ id: application.id, status })}
                className={cn(
                  "flex min-h-11 w-full items-center justify-between rounded-lg border px-3 text-sm outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring disabled:opacity-60",
                  selected
                    ? "border-primary bg-tint text-primary"
                    : "border-border bg-white text-navy hover:border-primary",
                )}
              >
                {APPLICATION_STATUS_LABELS[status]}
                {selected ? <Check className="size-4" aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>
      )}
      {updateStatus.error ? (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {updateStatus.error.message}
        </p>
      ) : null}
    </section>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right break-words text-navy">{children}</dd>
    </div>
  );
}

function InfoCard({ application }: { application: ApplicationDetailResponse }) {
  return (
    <section className={cn(cardClassName, "space-y-4")}>
      <h2 className="text-base font-semibold text-navy">Application</h2>
      <dl className="space-y-3">
        <InfoRow label="Listing">
          <Link
            href={`/dashboard/recruiter/listings/${application.jobId}`}
            className="text-primary hover:underline"
          >
            {application.jobTitle}
          </Link>
        </InfoRow>
        <InfoRow label="Applied">{formatDate(application.createdAt)}</InfoRow>
        <InfoRow label="Last updated">{formatDate(application.statusChangedAt)}</InfoRow>
        <InfoRow label="First viewed">
          {application.viewedAt ? formatDate(application.viewedAt) : "Not yet"}
        </InfoRow>
      </dl>
    </section>
  );
}

export function CandidateDetail({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const { data: application, isPending, error } = useApplication(id);

  const loadedId = application?.id;
  useEffect(() => {
    if (!loadedId) return;
    void queryClient.invalidateQueries({ queryKey: applicationKeys.lists });
  }, [loadedId, queryClient]);

  if (isPending) {
    return (
      <>
        <BackLink />
        <div
          role="status"
          aria-label="Loading application"
          className="h-64 animate-pulse rounded-xl border border-border bg-white"
        />
      </>
    );
  }

  if (error instanceof ApiError && error.status === 404) {
    return (
      <>
        <BackLink />
        <p className="text-sm text-muted-foreground">Application not found.</p>
      </>
    );
  }

  if (error || !application) {
    return (
      <>
        <BackLink />
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error?.message ?? "Application not found."}
        </p>
      </>
    );
  }

  return (
    <>
      <BackLink listingId={application.jobId} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <section
          className={cn(
            cardClassName,
            "flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between lg:col-start-1",
          )}
        >
          <div className="flex min-w-0 items-start gap-4">
            <span
              aria-hidden="true"
              className="flex size-14 shrink-0 items-center justify-center rounded-full bg-tint font-semibold text-primary"
            >
              {getInitials(application.applicantName)}
            </span>
            <div className="min-w-0 space-y-1">
              <h1 className="text-2xl font-bold tracking-tight break-words text-navy">
                {application.applicantName ?? "Unnamed applicant"}
              </h1>
              <a
                href={`mailto:${application.applicantEmail}`}
                className="inline-flex items-start gap-1.5 text-sm break-all text-primary hover:underline"
              >
                <Mail className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {application.applicantEmail}
              </a>
              <p className="text-sm text-muted-foreground">
                Applied {formatDate(application.createdAt)}
              </p>
            </div>
          </div>
          <ApplicationStatusBadge status={application.status} />
        </section>

        <div className="space-y-6 lg:col-start-2 lg:row-span-3 lg:row-start-1">
          <StatusCard application={application} />
          <InfoCard application={application} />
        </div>

        <section className={cn(cardClassName, "min-w-0 space-y-4 lg:col-start-1")}>
          <h2 className="text-base font-semibold text-navy">Skills</h2>
          <SkillGroup
            title="Matched"
            skills={application.skillsMatched}
            chipClassName={MATCHED_CHIP}
          />
          <SkillGroup
            title="Missing"
            skills={application.skillsMissing}
            chipClassName={MISSING_CHIP}
          />
        </section>

        <section className={cn(cardClassName, "min-w-0 space-y-3 lg:col-start-1")}>
          <h2 className="text-base font-semibold text-navy">Resume</h2>
          <p className="text-sm leading-relaxed break-words whitespace-pre-wrap text-navy">
            {application.resumeSnapshot}
          </p>
        </section>
      </div>
    </>
  );
}
