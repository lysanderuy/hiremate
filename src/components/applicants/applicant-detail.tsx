"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, Mail } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { MatchedChip, MissingChip } from "@/components/applicants/skill-chip";
import { Avatar } from "@/components/shared/avatar";
import {
  BAND_TEXT,
  MATCH_BAND_LABELS,
  ScoreCell,
  getMatchBand,
} from "@/components/shared/match-score";
import { CRUMB_CLASS } from "@/components/shared/page-header";
import { ApplicationStatusPill } from "@/components/shared/status-pill";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useApplication } from "@/hooks/use-application";
import { applicationKeys, useApplications } from "@/hooks/use-applications";
import { useUpdateApplicationStatus } from "@/hooks/use-update-application-status";
import { ApiError } from "@/lib/api/client";
import { parseViewState } from "@/lib/applicants/view-state";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { APPLICATION_STATUS_LABELS } from "@/types/applications";
import {
  RECRUITER_SETTABLE_STATUSES,
  type ApplicationDetailResponse,
} from "@/validators/application.validator";

const APPLICANTS_PATH = "/dashboard/recruiter/applicants";

const CARD_CLASS = "gap-0 p-6";
const CARD_TITLE_CLASS = "mb-4 text-base font-semibold";

function BackLink({ listingId }: { listingId?: string }) {
  const query = useSearchParams().toString();
  const href = query
    ? `${APPLICANTS_PATH}?${query}`
    : listingId
      ? `${APPLICANTS_PATH}?listing=${listingId}`
      : APPLICANTS_PATH;

  return (
    <Link href={href} className={CRUMB_CLASS}>
      <ArrowLeft aria-hidden="true" className="size-4.5" />
      Applicants
    </Link>
  );
}

function SkillGroup({
  title,
  skills,
  chip: Chip,
}: {
  title: string;
  skills: string[];
  chip: typeof MatchedChip;
}) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold">
        {title} ({skills.length})
      </h3>
      {skills.length === 0 ? (
        <span className="text-muted-foreground">None</span>
      ) : (
        <ul aria-label={title} className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <Chip key={skill}>{skill}</Chip>
          ))}
        </ul>
      )}
    </div>
  );
}

function ScoreCard({ application }: { application: ApplicationDetailResponse }) {
  const { matchScore } = application;
  const band = matchScore === null ? null : getMatchBand(matchScore);
  const matched = application.skillsMatched.length;
  const total = matched + application.skillsMissing.length;
  const firstName = application.applicantName?.trim().split(/\s+/)[0] ?? "This applicant";

  return (
    <Card className={CARD_CLASS}>
      {matchScore === null || band === null ? (
        <ScoreCell score={null} />
      ) : (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div
            className={cn(
              "font-display text-score-sm leading-none font-bold tracking-[-0.04em] tabular-nums sm:text-score",
              BAND_TEXT[band],
            )}
          >
            {matchScore}
            <small className="text-lg font-medium tracking-normal text-muted-foreground">
              /100
            </small>
          </div>
          <div className="min-w-55 flex-1">
            <Badge variant={band}>{MATCH_BAND_LABELS[band]} match</Badge>
            <p className="mt-2 font-medium text-ink">
              {total === 0
                ? "This job lists no skills, so the score is based on meaning only."
                : `${firstName} has ${matched} of ${total} skills this job asks for.`}
            </p>
          </div>
        </div>
      )}
      {total > 0 && (
        <div className="mt-5 border-t border-line pt-5">
          <div className="mb-1.5 flex justify-between text-sm">
            <span>Skills match</span>
            <b className="font-semibold text-ink">
              {matched} of {total}
            </b>
          </div>
          <div
            role="meter"
            aria-label="Skills match"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={matched}
            aria-valuetext={`${matched} of ${total}`}
            className="h-2 overflow-hidden rounded-full bg-weak-soft"
          >
            <span
              className="block h-full rounded-full bg-primary"
              style={{ width: `${(matched / total) * 100}%` }}
            />
          </div>
        </div>
      )}
    </Card>
  );
}

function StatusCard({ application }: { application: ApplicationDetailResponse }) {
  const updateStatus = useUpdateApplicationStatus();
  const locked = application.status === "withdrawn";
  const errorMessage =
    updateStatus.error instanceof ApiError && updateStatus.error.status === 409
      ? updateStatus.error.message
      : "The status could not be updated. Try again.";

  return (
    <Card className={CARD_CLASS}>
      <h2 className={CARD_TITLE_CLASS}>Status</h2>
      <div role="group" aria-label="Application status" className="grid gap-2">
        {RECRUITER_SETTABLE_STATUSES.map((status) => {
          const selected = application.status === status;
          return (
            <button
              key={status}
              type="button"
              aria-pressed={selected}
              disabled={locked || updateStatus.isPending}
              onClick={() => {
                if (!selected) updateStatus.mutate({ id: application.id, status });
              }}
              className={cn(
                "flex h-10 w-full items-center justify-between rounded-md border px-4 font-medium transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50",
                selected
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-line bg-white text-ink enabled:hover:border-muted-foreground",
              )}
            >
              {APPLICATION_STATUS_LABELS[status]}
              {selected && <Check aria-hidden="true" className="size-4.5" />}
            </button>
          );
        })}
      </div>
      {locked && (
        <p className="mt-3 text-xs text-muted-foreground">
          This applicant withdrew. The status cannot be changed.
        </p>
      )}
      {updateStatus.isError && (
        <p role="alert" className="mt-3 rounded-md bg-error-soft px-3 py-2 text-xs text-error">
          {errorMessage}
        </p>
      )}
    </Card>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right font-medium break-words text-ink">{children}</dd>
    </div>
  );
}

function ApplicationCard({ application }: { application: ApplicationDetailResponse }) {
  return (
    <Card className={CARD_CLASS}>
      <h2 className={CARD_TITLE_CLASS}>Application</h2>
      <dl className="grid gap-3 text-sm">
        <InfoRow label="Listing">
          <Link
            href={`${APPLICANTS_PATH}?listing=${application.jobId}`}
            className="text-primary hover:underline"
          >
            {application.jobTitle}
          </Link>
        </InfoRow>
        <InfoRow label="Applied">{formatDate(application.createdAt)}</InfoRow>
        <InfoRow label="First viewed">
          {application.viewedAt ? formatDate(application.viewedAt) : "Not yet"}
        </InfoRow>
        <InfoRow label="Last updated">{formatDate(application.statusChangedAt)}</InfoRow>
      </dl>
    </Card>
  );
}

function PrevNext({ application }: { application: ApplicationDetailResponse }) {
  const searchParams = useSearchParams();
  const query = searchParams.toString() || `listing=${application.jobId}`;
  const view = parseViewState(searchParams, application.jobId);
  const { data } = useApplications(application.jobId, {
    status: view.status,
    band: view.band,
    search: view.q,
    sort: view.sort,
  });

  const items = data?.items ?? [];
  const index = items.findIndex((item) => item.id === application.id);
  const previous = index > 0 ? items[index - 1] : undefined;
  const next = index >= 0 ? items[index + 1] : undefined;

  const linkClass = cn(buttonVariants({ variant: "outline", size: "sm" }), "flex-1");

  return (
    <nav aria-label="Applicants in list order" className="flex gap-2">
      {previous ? (
        <Link href={`${APPLICANTS_PATH}/${previous.id}?${query}`} className={linkClass}>
          <ArrowLeft aria-hidden="true" />
          Previous
        </Link>
      ) : (
        <Button variant="outline" size="sm" disabled className="flex-1">
          <ArrowLeft aria-hidden="true" />
          Previous
        </Button>
      )}
      {next ? (
        <Link href={`${APPLICANTS_PATH}/${next.id}?${query}`} className={linkClass}>
          Next
          <ArrowRight aria-hidden="true" />
        </Link>
      ) : (
        <Button variant="outline" size="sm" disabled className="flex-1">
          Next
          <ArrowRight aria-hidden="true" />
        </Button>
      )}
    </nav>
  );
}

export function ApplicantDetail({ id }: { id: string }) {
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
          aria-label="Loading applicant"
          className="h-64 animate-pulse rounded-xl border border-line bg-white"
        />
      </>
    );
  }

  if (error instanceof ApiError && error.status === 404) {
    return (
      <>
        <BackLink />
        <p>Applicant not found.</p>
      </>
    );
  }

  if (error || !application) {
    return (
      <>
        <BackLink />
        <p role="alert" className="rounded-md bg-error-soft px-4 py-3 text-error">
          {error?.message ?? "Applicant not found."}
        </p>
      </>
    );
  }

  const name = application.applicantName ?? "Unnamed applicant";

  return (
    <>
      <BackLink listingId={application.jobId} />
      <div className="grid items-start gap-5 min-[1100px]:grid-cols-[minmax(0,1fr)_21.25rem]">
        <div className="grid min-w-0 gap-5">
          <Card className={CARD_CLASS}>
            <div className="flex items-center gap-4">
              <Avatar name={name} className="size-14 text-lg" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h1 className="text-xl font-semibold break-words sm:text-2xl">{name}</h1>
                  <ApplicationStatusPill status={application.status} />
                </div>
                <a
                  href={`mailto:${application.applicantEmail}`}
                  className="inline-flex items-center gap-1.5 font-medium break-all text-primary hover:underline"
                >
                  <Mail aria-hidden="true" className="size-4 shrink-0" />
                  {application.applicantEmail}
                </a>
                <p>Applied {formatDate(application.createdAt)}</p>
              </div>
            </div>
          </Card>

          <ScoreCard application={application} />

          <Card className={CARD_CLASS}>
            <h2 className={CARD_TITLE_CLASS}>Skills</h2>
            <div className="grid gap-4">
              <SkillGroup title="Matched" skills={application.skillsMatched} chip={MatchedChip} />
              <SkillGroup title="Missing" skills={application.skillsMissing} chip={MissingChip} />
            </div>
          </Card>

          <Card className={CARD_CLASS}>
            <h2 className="mb-3 text-base font-semibold">Resume</h2>
            <p className="mb-3 text-xs text-muted-foreground">
              Plain text, as submitted with the application.
            </p>
            <div className="text-sm leading-[1.6] break-words whitespace-pre-wrap text-text">
              {application.resumeSnapshot}
            </div>
          </Card>
        </div>

        <div className="grid gap-5 min-[1100px]:sticky min-[1100px]:top-6">
          <StatusCard application={application} />
          <ApplicationCard application={application} />
          <PrevNext application={application} />
        </div>
      </div>
    </>
  );
}
