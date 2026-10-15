import Link from "next/link";

import { ChipList } from "@/components/jobs/skill-chips";
import { JobLogo } from "@/components/jobs/job-logo";
import { BAND_TEXT, MATCH_BAND_LABELS } from "@/components/shared/match-score";
import { ApplicationStatusPill } from "@/components/shared/status-pill";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatPostedAgo, formatSalaryRange } from "@/lib/format";
import { matchStatusMessage } from "@/lib/matching/copy";
import { cn } from "@/lib/utils";
import { EMPLOYMENT_TYPE_LABELS } from "@/types/jobs";
import type { OpenListingSummaryResponse } from "@/validators/open-listing.validator";

export const JOBS_PATH = "/dashboard/applicant/jobs";
const MAX_CHIPS = 6;

function JobSkills({ job }: { job: OpenListingSummaryResponse }) {
  if (job.skills.length === 0)
    return <span className="text-muted-foreground">No skills listed</span>;

  const { skillsMatch } = job;
  if (!skillsMatch) {
    return (
      <ChipList
        label="Skills this job asks for"
        skills={job.skills}
        kind="neutral"
        max={MAX_CHIPS}
      />
    );
  }

  const shown = [...skillsMatch.matched, ...skillsMatch.missing].slice(0, MAX_CHIPS);
  const hidden = skillsMatch.matched.length + skillsMatch.missing.length - shown.length;
  const matchedShown = shown.filter((skill) => skillsMatch.matched.includes(skill));
  const missingShown = shown.filter((skill) => !skillsMatch.matched.includes(skill));

  return (
    <ul aria-label="Skills this job asks for" className="flex flex-wrap gap-2">
      {matchedShown.map((skill) => (
        <li
          key={skill}
          title="You have this skill"
          className="inline-flex h-7 items-center rounded-full bg-primary-soft px-3 text-chip font-medium break-all text-primary"
        >
          <span className="sr-only">You have: </span>
          {skill}
        </li>
      ))}
      {missingShown.map((skill) => (
        <li
          key={skill}
          title="Missing"
          className="inline-flex h-7 items-center rounded-full border border-dashed border-line-dashed bg-white px-3 text-chip font-medium break-all text-muted-foreground"
        >
          <span className="sr-only">Missing: </span>
          {skill}
        </li>
      ))}
      {hidden > 0 && (
        <li className="inline-flex h-7 items-center rounded-full bg-weak-soft px-3 text-chip font-medium text-weak">
          <span aria-hidden="true">+{hidden}</span>
          <span className="sr-only">and {hidden} more</span>
        </li>
      )}
    </ul>
  );
}

function JobScore({ job }: { job: OpenListingSummaryResponse }) {
  if (!job.match) {
    return (
      <span className="text-sm text-muted-foreground">{matchStatusMessage(job.matchStatus)}</span>
    );
  }

  return (
    <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
      <span className="flex items-baseline">
        <span
          className={cn(
            "font-display text-2xl font-bold tracking-[-0.02em] tabular-nums",
            BAND_TEXT[job.match.band],
          )}
        >
          {job.match.score}
        </span>
        <span className="text-sm text-muted-foreground">/100</span>
      </span>
      <Badge variant={job.match.band}>{MATCH_BAND_LABELS[job.match.band]}</Badge>
    </div>
  );
}

export function JobCard({ job }: { job: OpenListingSummaryResponse }) {
  return (
    <Card className="relative gap-0 p-5 transition-colors focus-within:border-primary hover:border-muted-foreground">
      <div className="flex flex-wrap items-start gap-4 sm:flex-nowrap">
        <JobLogo company={job.companyName} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Link
              href={`${JOBS_PATH}/${job.id}`}
              className="text-md font-semibold break-words text-ink outline-none after:absolute after:inset-0 hover:text-primary focus-visible:after:outline-3 focus-visible:after:-outline-offset-2 focus-visible:after:outline-primary"
            >
              {job.title}
            </Link>
            {job.application && <ApplicationStatusPill status={job.application.status} />}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>{job.companyName}</span>
            <span>{job.location}</span>
            <span>{EMPLOYMENT_TYPE_LABELS[job.employmentType]}</span>
            <span>{formatSalaryRange(job.salaryMin, job.salaryMax)}</span>
            <span>{formatPostedAgo(job.createdAt)}</span>
          </div>
          <div className="mt-3">
            <JobSkills job={job} />
          </div>
        </div>
        <div className="shrink-0 max-sm:basis-full sm:text-right">
          <JobScore job={job} />
        </div>
      </div>
    </Card>
  );
}
