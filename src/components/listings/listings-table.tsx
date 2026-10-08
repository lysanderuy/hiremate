"use client";

import { Briefcase } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { ListingRowMenu } from "@/components/listings/listing-row-menu";
import { ListingStatusBadge } from "@/components/listings/listing-status-badge";
import { buttonVariants } from "@/components/ui/button";
import { useListings } from "@/hooks/use-listings";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { EMPLOYMENT_TYPE_LABELS } from "@/types/jobs";
import type { ListingResponse } from "@/validators/listing.validator";

const NEW_LISTING_PATH = "/dashboard/recruiter/listings/new";

const rowGrid =
  "lg:grid lg:grid-cols-[minmax(0,1fr)_5.5rem_5.5rem_7rem_2.5rem] lg:items-center lg:gap-4";

export function ListingsTable() {
  const { data, isPending, error } = useListings();

  if (isPending) {
    return (
      <div className="space-y-3" role="status" aria-label="Loading listings">
        {[0, 1, 2].map((key) => (
          <div key={key} className="h-24 animate-pulse rounded-xl border border-border bg-white" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
        {error.message}
      </p>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white px-6 py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-tint text-primary">
          <Briefcase className="size-6" />
        </span>
        <p className="mt-4 text-sm text-muted-foreground">You have no listings yet.</p>
        <Link href={NEW_LISTING_PATH} className={cn(buttonVariants(), "mt-4 h-9 px-4")}>
          + Create Job Listing
        </Link>
      </div>
    );
  }

  return (
    <div role="table" aria-label="Listings" className="space-y-3">
      <div
        role="row"
        className={cn(
          rowGrid,
          "hidden px-4 text-xs font-medium tracking-wide text-muted-foreground uppercase",
        )}
      >
        <span role="columnheader">Title</span>
        <span role="columnheader">Status</span>
        <span role="columnheader">Applicants</span>
        <span role="columnheader">Posted</span>
        <span role="columnheader" className="sr-only">
          Actions
        </span>
      </div>
      <div role="rowgroup" className="space-y-3">
        {data.map((listing) => (
          <ListingRow key={listing.id} listing={listing} />
        ))}
      </div>
    </div>
  );
}

function ListingRow({ listing }: { listing: ListingResponse }) {
  const [actionError, setActionError] = useState<string | null>(null);
  const isRemoved = listing.status === "removed";

  return (
    <div
      role="row"
      className={cn(
        rowGrid,
        "relative space-y-3 rounded-xl border border-border bg-white p-4 lg:space-y-0",
      )}
    >
      <div role="cell" className="min-w-0 pr-12 lg:pr-0">
        <Link
          href={`/dashboard/recruiter/listings/${listing.id}`}
          className="text-sm font-semibold break-words text-navy hover:text-primary hover:underline"
        >
          {listing.title}
        </Link>
        <p className="mt-0.5 text-sm break-words text-muted-foreground">
          {listing.location} · {EMPLOYMENT_TYPE_LABELS[listing.employmentType]}
        </p>
        {isRemoved && (
          <p className="mt-1 text-sm text-red-600">
            Removed by an administrator.
            {listing.removalReason ? ` ${listing.removalReason}` : ""}
          </p>
        )}
        {actionError && (
          <p role="alert" className="mt-1 text-sm text-red-600">
            {actionError}
          </p>
        )}
      </div>
      <div role="cell">
        <ListingStatusBadge status={listing.status} />
      </div>
      <div role="cell" className="text-sm text-navy">
        <span className="text-muted-foreground lg:hidden">Applicants: </span>
        {listing.applicantCount}
      </div>
      <div role="cell" className="text-sm text-navy">
        <span className="text-muted-foreground lg:hidden">Posted: </span>
        {formatDate(listing.createdAt)}
      </div>
      <div role="cell" className="absolute top-4 right-4 lg:static lg:justify-self-end">
        <ListingRowMenu listing={listing} onError={setActionError} />
      </div>
    </div>
  );
}
