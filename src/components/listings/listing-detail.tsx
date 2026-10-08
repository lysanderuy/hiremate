"use client";

import { Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ListingActions } from "@/components/listings/listing-actions";
import { ListingStatusBadge } from "@/components/listings/listing-status-badge";
import { TopScore } from "@/components/shared/match-score";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useListing } from "@/hooks/use-listing";
import { ApiError } from "@/lib/api/client";
import { formatDate, formatSalaryRange } from "@/lib/format";
import { EMPLOYMENT_TYPE_LABELS } from "@/types/jobs";

const LISTINGS_PATH = "/dashboard/recruiter/listings";
const APPLICANTS_PATH = "/dashboard/recruiter/applicants";

export function ListingDetail({ id }: { id: string }) {
  const router = useRouter();
  const { data: listing, isPending, error } = useListing(id);

  if (isPending) {
    return (
      <div
        role="status"
        aria-label="Loading listing"
        className="h-64 animate-pulse rounded-xl border border-line bg-white"
      />
    );
  }

  if (error instanceof ApiError && error.status === 404) {
    return <p className="text-muted-foreground">Listing not found.</p>;
  }

  if (error || !listing) {
    return (
      <p role="alert" className="rounded-md bg-error-soft px-4 py-3 text-error">
        {error?.message ?? "Listing not found."}
      </p>
    );
  }

  const isRemoved = listing.status === "removed";
  const applicantsHref = `${APPLICANTS_PATH}?listing=${listing.id}`;

  return (
    <div className="grid gap-5">
      <Card className="gap-0 p-5 min-[641px]:p-6">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-semibold break-words sm:text-2xl">{listing.title}</h1>
              <ListingStatusBadge status={listing.status} />
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-muted-foreground">
              <span>{listing.location}</span>
              <span>{EMPLOYMENT_TYPE_LABELS[listing.employmentType]}</span>
              <span>{formatSalaryRange(listing.salaryMin, listing.salaryMax)}</span>
              <span>Posted {formatDate(listing.createdAt)}</span>
            </div>
          </div>

          {!isRemoved && (
            <ListingActions listing={listing} onDeleted={() => router.push(LISTINGS_PATH)} />
          )}
        </div>

        {isRemoved && (
          <p role="alert" className="mt-4 rounded-md bg-error-soft px-4 py-3 text-error">
            Removed by an administrator.
            {listing.removalReason ? ` ${listing.removalReason}` : ""}
          </p>
        )}
      </Card>

      <Card className="gap-0 p-5 min-[641px]:p-6">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <div>
              <b className="block font-display text-[1.75rem] leading-tight font-semibold tracking-[-0.02em] text-ink tabular-nums">
                {listing.applicantCount}
              </b>
              <span className="text-sm text-muted-foreground">Applicants</span>
            </div>
            <div>
              <div className="leading-tight">
                <TopScore score={listing.topMatchScore} className="text-3xl" />
              </div>
              <span className="text-sm text-muted-foreground">Top match</span>
            </div>
          </div>
          {listing.applicantCount > 0 ? (
            <Link href={applicantsHref} className={buttonVariants({ size: "sm" })}>
              <Users aria-hidden="true" />
              View applicants ({listing.applicantCount})
            </Link>
          ) : (
            <Button type="button" size="sm" disabled>
              <Users aria-hidden="true" />
              View applicants (0)
            </Button>
          )}
        </div>
      </Card>

      <Card className="gap-0 p-5 min-[641px]:p-6">
        <h2 className="mb-3 text-base font-semibold tracking-[-0.01em]">Description</h2>
        <p className="leading-[1.6] break-words whitespace-pre-wrap">{listing.description}</p>
      </Card>

      <Card className="gap-0 p-5 min-[641px]:p-6">
        <h2 className="mb-3 text-base font-semibold tracking-[-0.01em]">Skills</h2>
        {listing.skills.length === 0 ? (
          <p className="text-muted-foreground">No skills listed.</p>
        ) : (
          <ul className="flex flex-wrap gap-2" aria-label="Listing skills">
            {listing.skills.map((skill) => (
              <li
                key={skill.id}
                className="inline-flex h-7 items-center rounded-full bg-primary-soft px-3 text-chip font-medium text-primary"
              >
                {skill.name}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
