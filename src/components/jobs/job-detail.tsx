"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ApplyDialog } from "@/components/jobs/apply-dialog";
import { JOBS_PATH } from "@/components/jobs/job-card";
import { JobLogo } from "@/components/jobs/job-logo";
import { MatchCard } from "@/components/jobs/match-card";
import { ChipList } from "@/components/jobs/skill-chips";
import { CRUMB_CLASS } from "@/components/shared/page-header";
import { ApplicationStatusPill } from "@/components/shared/status-pill";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useApply } from "@/hooks/use-apply";
import { useMyApplication } from "@/hooks/use-my-application";
import { useOpenListing } from "@/hooks/use-open-listing";
import { useResume } from "@/hooks/use-resume";
import { ApiError } from "@/lib/api/client";
import { formatDate, formatPostedAgo, formatSalaryRange } from "@/lib/format";
import { EMPLOYMENT_TYPE_LABELS } from "@/types/jobs";

const RESUME_PATH = "/dashboard/applicant/resume";
const APPLICATIONS_PATH = "/dashboard/applicant/applications";
const CARD_CLASS = "gap-0 p-5 min-[641px]:p-6";
const CARD_TITLE_CLASS = "mb-3 text-base font-semibold tracking-[-0.01em]";

function BackLink() {
  return (
    <Link href={JOBS_PATH} className={CRUMB_CLASS}>
      <ArrowLeft aria-hidden="true" className="size-4.5" />
      Browse jobs
    </Link>
  );
}

export function JobDetail({ id }: { id: string }) {
  const { data: listing, isPending, error, refetch } = useOpenListing(id);
  const { data: resume, refetch: refetchResume } = useResume();
  const { data: application } = useMyApplication(listing?.application?.id ?? "");
  const apply = useApply();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sent, setSent] = useState(false);

  if (isPending) {
    return (
      <>
        <BackLink />
        <div
          role="status"
          aria-label="Loading job"
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
            <h2 className="mb-2 text-base font-semibold">This listing is not open.</h2>
            <p className="mb-4">It may have been closed or removed.</p>
            <Link href={JOBS_PATH} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Back to jobs
            </Link>
          </div>
        </Card>
      </>
    );
  }

  if (error || !listing) {
    return (
      <>
        <BackLink />
        <p role="alert" className="rounded-md bg-error-soft px-4 py-3 text-error">
          {error?.message ?? "Could not load this job."}
        </p>
      </>
    );
  }

  const resumeFailed = resume?.state === "failed";

  function openConfirm() {
    apply.reset();
    setConfirmOpen(true);
  }

  function confirmApply() {
    apply.mutate(
      { listingId: id },
      {
        onSuccess: () => {
          setConfirmOpen(false);
          setSent(true);
        },
        onError: (applyError) => {
          if (
            applyError instanceof ApiError &&
            (applyError.status === 404 || applyError.status === 409)
          ) {
            void refetch();
          }
        },
      },
    );
  }

  let matchFallback: React.ReactNode;
  if (listing.matchStatus === "no_resume") {
    matchFallback = (
      <>
        <p className="font-medium text-ink">Add a resume to see your match score.</p>
        <Link href={RESUME_PATH} className={`${buttonVariants({ size: "sm" })} mt-4`}>
          Add resume
        </Link>
      </>
    );
  } else if (listing.matchStatus === "resume_not_ready") {
    matchFallback = resumeFailed ? (
      <>
        <p className="font-medium text-ink">We could not process your resume. Try again.</p>
        <Link
          href={RESUME_PATH}
          className={`${buttonVariants({ variant: "outline", size: "sm" })} mt-4`}
        >
          Go to My resume
        </Link>
      </>
    ) : (
      <>
        <p className="font-medium text-ink">
          Your resume is being prepared. Try again in a moment.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => {
            void refetch();
            void refetchResume();
          }}
        >
          Try again
        </Button>
      </>
    );
  } else {
    matchFallback = (
      <p className="font-medium text-ink">
        No skills are listed for this job, so there is no score.
      </p>
    );
  }

  let applyBlock: React.ReactNode;
  if (listing.application) {
    applyBlock = (
      <>
        {sent && (
          <p role="status" className="rounded-md bg-primary-soft px-3 py-2 text-primary">
            Application sent.
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-medium text-ink">
            {application ? `You applied on ${formatDate(application.createdAt)}` : "You applied"}
          </span>
          <ApplicationStatusPill status={listing.application.status} />
        </div>
        <Link
          href={`${APPLICATIONS_PATH}/${listing.application.id}`}
          className={`${buttonVariants({ variant: "outline" })} w-full`}
        >
          View application
        </Link>
      </>
    );
  } else if (listing.matchStatus === "no_resume") {
    applyBlock = (
      <>
        <Link href={RESUME_PATH} className={`${buttonVariants()} w-full`}>
          Apply
        </Link>
        <span className="text-xs text-muted-foreground">
          You need a resume to apply. We take you there first.
        </span>
      </>
    );
  } else if (listing.matchStatus === "resume_not_ready") {
    applyBlock = (
      <>
        <Button disabled className="w-full">
          Apply
        </Button>
        <span className="text-xs text-muted-foreground">
          {resumeFailed
            ? "Retry processing your resume to apply."
            : "Apply opens when your resume is ready."}
        </span>
      </>
    );
  } else {
    applyBlock = (
      <Button className="w-full" onClick={openConfirm}>
        Apply
      </Button>
    );
  }

  return (
    <>
      <BackLink />
      <div className="grid items-start gap-5 min-[1100px]:grid-cols-[minmax(0,1fr)_21.25rem]">
        <div className="grid min-w-0 gap-5">
          <Card className={CARD_CLASS}>
            <div className="flex items-start gap-4">
              <JobLogo company={listing.companyName} className="size-14 text-xl" />
              <div className="min-w-0">
                <h1 className="text-xl font-semibold break-words sm:text-2xl">{listing.title}</h1>
                <p className="mt-1">{listing.companyName}</p>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-muted-foreground">
                  <span>{listing.location}</span>
                  <span>{EMPLOYMENT_TYPE_LABELS[listing.employmentType]}</span>
                  <span>{formatSalaryRange(listing.salaryMin, listing.salaryMax)}</span>
                  <span>{formatPostedAgo(listing.createdAt)}</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className={CARD_CLASS}>
            <h2 className={CARD_TITLE_CLASS}>Description</h2>
            <p className="leading-[1.6] break-words whitespace-pre-wrap">{listing.description}</p>
          </Card>

          <Card className={CARD_CLASS}>
            <h2 className={CARD_TITLE_CLASS}>Skills this job asks for</h2>
            {listing.skills.length === 0 ? (
              <p className="text-muted-foreground">No skills listed.</p>
            ) : (
              <ChipList label="Skills this job asks for" skills={listing.skills} kind="neutral" />
            )}
          </Card>
        </div>

        <div className="grid gap-5 min-[1100px]:sticky min-[1100px]:top-6">
          <MatchCard
            heading="Your match"
            tense="present"
            match={listing.match}
            fallback={matchFallback}
            note="A score helps you decide. It does not decide for you."
          />
          <div className="grid gap-3">{applyBlock}</div>
        </div>
      </div>

      <ApplyDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={listing.title}
        company={listing.companyName}
        resumeSavedLabel={resume ? `Saved ${formatDate(resume.updatedAt)}` : "Saved resume"}
        match={listing.match}
        pending={apply.isPending}
        error={apply.error?.message ?? null}
        onConfirm={confirmApply}
      />
    </>
  );
}
