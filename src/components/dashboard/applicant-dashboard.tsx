"use client";

import { FileText, Search } from "lucide-react";
import Link from "next/link";

import { ResumeCallout } from "@/components/resume/resume-callout";
import { SkillChips } from "@/components/resume/skill-chips";
import { DataTable, Td, Th } from "@/components/shared/data-table";
import { MATCH_BAND_LABELS, ScoreCell } from "@/components/shared/match-score";
import { PageHeader } from "@/components/shared/page-header";
import { ApplicationStatusPill } from "@/components/shared/status-pill";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useApplicantDashboard } from "@/hooks/use-applicant-dashboard";
import { useProfile } from "@/hooks/use-profile";
import { useResume } from "@/hooks/use-resume";
import { formatDate } from "@/lib/format";
import { RESUME_SOURCE_LABELS } from "@/lib/resume/client-file";
import { cn } from "@/lib/utils";
import type { ApplicantDashboardResponse } from "@/validators/dashboard.validator";

const BASE_PATH = "/dashboard/applicant";
const JOBS_PATH = `${BASE_PATH}/jobs`;
const APPLICATIONS_PATH = `${BASE_PATH}/applications`;
const RESUME_PATH = `${BASE_PATH}/resume`;
const MAX_SKILLS_SHOWN = 12;

type ResumeSummary = ApplicantDashboardResponse["resume"];

const RESUME_STATE_LABELS = {
  ready: "Ready",
  failed: "Failed",
  none: "Not added",
} as const;

function SectionCard({
  title,
  href,
  linkLabel,
  children,
}: {
  title: string;
  href: string;
  linkLabel: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="gap-0 py-0">
      <div className="flex items-center justify-between gap-4 px-5 pt-5 pb-3">
        <h2 className="text-base font-semibold tracking-[-0.01em]">{title}</h2>
        <Link href={href} className="text-sm font-medium text-primary hover:underline">
          {linkLabel}
        </Link>
      </div>
      {children}
    </Card>
  );
}

function SectionMessage({
  message,
  isError,
  bordered = true,
}: {
  message: string;
  isError?: boolean;
  bordered?: boolean;
}) {
  return (
    <p
      role={isError ? "alert" : undefined}
      className={cn(
        "px-5 py-8 text-center",
        bordered && "border-t border-line",
        isError ? "text-error" : "text-muted-foreground",
      )}
    >
      {message}
    </p>
  );
}

function resumeSubtext(resume: ResumeSummary): string {
  if (resume.state === "ready") {
    const saved = resume.updatedAt ? `Saved ${formatDate(resume.updatedAt)}` : "Saved";
    return resume.source ? `${saved} · ${RESUME_SOURCE_LABELS[resume.source]}` : saved;
  }
  if (resume.state === "failed") return "Open My resume to try again";
  return "Add one to see your scores";
}

function StatCard({
  label,
  loading,
  value,
  hint,
}: {
  label: string;
  loading: boolean;
  value: React.ReactNode;
  hint: string;
}) {
  return (
    <Card className="gap-0 p-4 min-[641px]:p-5">
      <span className="text-sm text-muted-foreground">{label}</span>
      {loading ? (
        <span
          role="status"
          aria-label={`Loading ${label}`}
          className="mt-2 block h-9 w-24 animate-pulse rounded-md bg-weak-soft"
        />
      ) : (
        <>
          <b className="mt-1 flex items-center gap-2 font-display text-3xl font-semibold tracking-[-0.03em] text-ink tabular-nums">
            {value}
          </b>
          <small className="mt-1 text-muted-foreground">{hint}</small>
        </>
      )}
    </Card>
  );
}

function StatCards({ data }: { data: ApplicantDashboardResponse | undefined }) {
  const best = data?.bestMatches[0];
  const state = data?.resume.state ?? "none";

  return (
    <div className="mb-6 grid gap-3 min-[641px]:gap-4 min-[961px]:grid-cols-3">
      <StatCard
        label="Resume"
        loading={!data}
        value={RESUME_STATE_LABELS[state]}
        hint={data ? resumeSubtext(data.resume) : ""}
      />
      <StatCard
        label="Applications"
        loading={!data}
        value={data?.applications.total}
        hint={
          data
            ? `${data.applications.shortlisted} shortlisted, ${data.applications.waiting} waiting`
            : ""
        }
      />
      <StatCard
        label="Best match"
        loading={!data}
        value={
          best ? (
            <>
              {best.match.score}
              <Badge variant={best.match.band}>{MATCH_BAND_LABELS[best.match.band]}</Badge>
            </>
          ) : (
            "None"
          )
        }
        hint={
          best
            ? best.title
            : state === "ready"
              ? "No Fair or Strong matches yet"
              : "Add a resume to see scores"
        }
      />
    </div>
  );
}

function ResumeBanner({ resume }: { resume: ResumeSummary }) {
  if (resume.state === null) {
    return (
      <ResumeCallout
        action={
          <Link href={RESUME_PATH} className={buttonVariants({ size: "xs" })}>
            Add resume
          </Link>
        }
      >
        Add your resume to see how well you fit each job.
      </ResumeCallout>
    );
  }
  if (resume.state === "failed") {
    return (
      <ResumeCallout
        tone="error"
        action={
          <Link href={RESUME_PATH} className={buttonVariants({ size: "xs" })}>
            Go to My resume
          </Link>
        }
      >
        We could not process your resume. Try again.
      </ResumeCallout>
    );
  }
  return null;
}

function YourResume({ data }: { data: ApplicantDashboardResponse | undefined }) {
  const resume = useResume();
  const state = data?.resume.state ?? null;
  const skills = resume.data?.skills ?? [];

  let body: React.ReactNode;
  if (!data) {
    body = <SectionMessage message="Loading resume..." bordered={false} />;
  } else if (state === null) {
    body = <p>No resume yet. Upload a PDF to see your matches.</p>;
  } else if (state === "failed") {
    body = <p>We could not read this resume. Try again to find your skills.</p>;
  } else {
    body = (
      <>
        <p className="mb-3">
          <b className="text-ink">{data.resume.skillCount} skills found.</b> They are used to work
          out your matches.
        </p>
        {skills.length > 0 && <SkillChips skills={skills} max={MAX_SKILLS_SHOWN} />}
      </>
    );
  }

  return (
    <SectionCard title="Your resume" href={RESUME_PATH} linkLabel={state === null ? "Add" : "Edit"}>
      <div className="px-5 pt-1 pb-5">{body}</div>
    </SectionCard>
  );
}

function BestMatches({
  data,
  isPending,
  errorMessage,
}: {
  data: ApplicantDashboardResponse | undefined;
  isPending: boolean;
  errorMessage: string | undefined;
}) {
  let body: React.ReactNode;
  if (isPending) {
    body = <SectionMessage message="Loading matches..." />;
  } else if (!data) {
    body = <SectionMessage message={errorMessage ?? "Could not load matches."} isError />;
  } else if (data.bestMatches.length === 0) {
    const message =
      data.resume.state === null
        ? "Add a resume to see your best matches."
        : data.resume.state === "ready"
          ? "No Fair or Strong matches yet. Check back when new jobs are posted."
          : "Your matches show up when your resume is ready.";
    body = <SectionMessage message={message} />;
  } else {
    body = (
      <ul>
        {data.bestMatches.map((job) => (
          <li key={job.id}>
            <Link
              href={`${JOBS_PATH}/${job.id}`}
              className="flex items-center justify-between gap-3 border-t border-line px-5 py-4 transition-colors hover:bg-primary-soft/30 focus-visible:outline-3 focus-visible:-outline-offset-2 focus-visible:outline-primary"
            >
              <span className="min-w-0">
                <b className="block font-semibold break-words text-ink">{job.title}</b>
                <small className="text-muted-foreground">
                  {job.companyName} &middot; {job.location}
                </small>
              </span>
              <ScoreCell score={job.match.score} band={job.match.band} />
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <SectionCard title="Best matches" href={JOBS_PATH} linkLabel="View all jobs">
      {body}
    </SectionCard>
  );
}

function RecentApplications({
  data,
  isPending,
  errorMessage,
}: {
  data: ApplicantDashboardResponse | undefined;
  isPending: boolean;
  errorMessage: string | undefined;
}) {
  let body: React.ReactNode;
  if (isPending) {
    body = <SectionMessage message="Loading applications..." />;
  } else if (!data) {
    body = <SectionMessage message={errorMessage ?? "Could not load applications."} isError />;
  } else if (data.recent.length === 0) {
    body = <SectionMessage message="No applications yet. Browse jobs to apply." />;
  } else {
    body = (
      <DataTable label="Recent applications" className="min-w-0">
        <thead>
          <tr>
            <Th>Job</Th>
            <Th>Status</Th>
            <Th>Score when applied</Th>
            <Th className="max-sm:hidden">Applied</Th>
          </tr>
        </thead>
        <tbody>
          {data.recent.map((application) => (
            <tr
              key={application.id}
              className="relative transition-colors focus-within:bg-primary-soft/30 hover:bg-primary-soft/30"
            >
              <Td>
                <Link
                  href={`${APPLICATIONS_PATH}/${application.id}`}
                  className="block font-semibold break-words text-ink outline-none after:absolute after:inset-0 focus-visible:after:outline-3 focus-visible:after:-outline-offset-2 focus-visible:after:outline-primary"
                >
                  {application.jobTitle}
                </Link>
                <small className="text-xs text-muted-foreground">{application.companyName}</small>
              </Td>
              <Td>
                <ApplicationStatusPill status={application.status} />
              </Td>
              <Td>
                <ScoreCell score={application.matchScore} band={application.band} />
              </Td>
              <Td className="max-sm:hidden">{formatDate(application.createdAt)}</Td>
            </tr>
          ))}
        </tbody>
      </DataTable>
    );
  }

  return (
    <SectionCard title="Recent applications" href={APPLICATIONS_PATH} linkLabel="View all">
      {body}
    </SectionCard>
  );
}

export function ApplicantDashboard() {
  const { data, isPending, error } = useApplicantDashboard();
  const profile = useProfile();
  const firstName = profile.data?.displayName?.trim().split(/\s+/)[0];
  const resumeReady = data?.resume.state === "ready";

  return (
    <div>
      <PageHeader
        title={firstName ? `Welcome back, ${firstName}` : "Welcome back"}
        description="Here is where you stand."
        action={
          data && (
            <Link
              href={resumeReady ? JOBS_PATH : RESUME_PATH}
              className={buttonVariants({ size: "sm" })}
            >
              {resumeReady ? <Search aria-hidden="true" /> : <FileText aria-hidden="true" />}
              {resumeReady
                ? "Browse jobs"
                : data.resume.state === null
                  ? "Add resume"
                  : "Open My resume"}
            </Link>
          )
        }
      />
      {error && !data && (
        <p role="alert" className="mb-6 rounded-md bg-error-soft px-4 py-3 text-error">
          {error.message}
        </p>
      )}
      {data && <ResumeBanner resume={data.resume} />}
      <StatCards data={data} />
      <div className="mb-6 grid items-start gap-6 min-[1101px]:grid-cols-2">
        <YourResume data={data} />
        <BestMatches data={data} isPending={isPending} errorMessage={error?.message} />
      </div>
      <RecentApplications data={data} isPending={isPending} errorMessage={error?.message} />
    </div>
  );
}
