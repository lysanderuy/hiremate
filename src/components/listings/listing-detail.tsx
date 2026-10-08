"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { ListingActions } from "@/components/listings/listing-actions";
import { ListingStatusBadge } from "@/components/listings/listing-status-badge";
import { buttonVariants } from "@/components/ui/button";
import { useListing } from "@/hooks/use-listing";
import { ApiError } from "@/lib/api/client";
import { formatDate, formatSalaryRange } from "@/lib/format";
import { EMPLOYMENT_TYPE_LABELS } from "@/types/jobs";

const LISTINGS_PATH = "/dashboard/recruiter/listings";
const CANDIDATES_PATH = "/dashboard/recruiter/candidates";

export function ListingDetail({ id }: { id: string }) {
  const router = useRouter();
  const { data: listing, isPending, error } = useListing(id);

  if (isPending) {
    return (
      <div
        role="status"
        aria-label="Loading listing"
        className="h-64 animate-pulse rounded-xl border border-border bg-white"
      />
    );
  }

  if (error instanceof ApiError && error.status === 404) {
    return <p className="text-sm text-muted-foreground">Listing not found.</p>;
  }

  if (error || !listing) {
    return (
      <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
        {error?.message ?? "Listing not found."}
      </p>
    );
  }

  const isRemoved = listing.status === "removed";

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-white p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight break-words text-navy">
                {listing.title}
              </h1>
              <ListingStatusBadge status={listing.status} />
            </div>
            <p className="text-sm break-words text-muted-foreground">
              {listing.location} · {EMPLOYMENT_TYPE_LABELS[listing.employmentType]} ·{" "}
              {formatSalaryRange(listing.salaryMin, listing.salaryMax)}
            </p>
            <p className="text-sm text-muted-foreground">Posted {formatDate(listing.createdAt)}</p>
          </div>

          {!isRemoved && (
            <ListingActions listing={listing} onDeleted={() => router.push(LISTINGS_PATH)} />
          )}
        </div>

        {isRemoved && (
          <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            Removed by an administrator.
            {listing.removalReason ? ` ${listing.removalReason}` : ""}
          </p>
        )}
      </div>

      <div className="rounded-xl border border-border bg-white p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-navy">
            <span className="font-semibold">{listing.applicantCount}</span>{" "}
            {listing.applicantCount === 1 ? "applicant" : "applicants"}
          </p>
          <Link
            href={`${CANDIDATES_PATH}?listing=${listing.id}`}
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            View applicants ({listing.applicantCount})
          </Link>
        </div>
      </div>

      <div className="space-y-6 rounded-xl border border-border bg-white p-4 sm:p-6">
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-navy">Description</h2>
          <p className="text-sm leading-relaxed break-words whitespace-pre-wrap text-navy">
            {listing.description}
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-navy">Skills</h2>
          {listing.skills.length === 0 ? (
            <p className="text-sm text-muted-foreground">No skills listed.</p>
          ) : (
            <ul className="flex flex-wrap gap-2" aria-label="Listing skills">
              {listing.skills.map((skill) => (
                <li
                  key={skill.id}
                  className="inline-flex min-h-8 items-center rounded-full bg-tint px-3 text-sm text-primary"
                >
                  {skill.name}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
