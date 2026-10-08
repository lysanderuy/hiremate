"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { DataTable, Td, Th } from "@/components/shared/data-table";
import { TopScore } from "@/components/shared/match-score";
import { ListingRowMenu } from "@/components/listings/listing-row-menu";
import { ListingStatusBadge } from "@/components/listings/listing-status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useListings } from "@/hooks/use-listings";
import { formatDate, formatSalaryRange } from "@/lib/format";
import { cn } from "@/lib/utils";
import { EMPLOYMENT_TYPE_LABELS } from "@/types/jobs";
import type { ListingResponse } from "@/validators/listing.validator";

const NEW_LISTING_PATH = "/dashboard/recruiter/listings/new";

const TABS = ["all", "open", "closed"] as const;
type Tab = (typeof TABS)[number];

const TAB_LABELS: Record<Tab, string> = { all: "All", open: "Open", closed: "Closed" };

function matchesTab(listing: ListingResponse, tab: Tab) {
  return tab === "all" || listing.status === tab;
}

export function ListingsTable() {
  const { data, isPending, error } = useListings();
  const [tab, setTab] = useState<Tab>("all");

  if (isPending) {
    return (
      <div role="status" aria-label="Loading listings">
        <div className="h-72 animate-pulse rounded-xl border border-line bg-white" />
      </div>
    );
  }

  if (error) {
    return (
      <p role="alert" className="rounded-md bg-error-soft px-4 py-3 text-error">
        {error.message}
      </p>
    );
  }

  const rows = data.filter((listing) => matchesTab(listing, tab));

  return (
    <div>
      <div
        role="group"
        aria-label="Filter listings by status"
        className="mb-4 inline-flex gap-1 rounded-md border border-line bg-white p-1"
      >
        {TABS.map((key) => {
          const selected = tab === key;
          const total = data.filter((listing) => matchesTab(listing, key)).length;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={selected}
              onClick={() => setTab(key)}
              className={cn(
                "h-9 rounded-lg px-4 text-sm font-medium transition-colors",
                selected ? "bg-primary-soft text-primary" : "text-text hover:bg-page",
              )}
            >
              {TAB_LABELS[key]}
              <small
                className={cn(
                  "ml-1.5 font-medium",
                  selected ? "text-primary" : "text-muted-foreground",
                )}
              >
                {total}
              </small>
            </button>
          );
        })}
      </div>

      <Card className="gap-0 py-0">
        {rows.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <h3 className="mb-2 text-base font-semibold">
              {data.length === 0
                ? "No listings yet"
                : `No ${TAB_LABELS[tab].toLowerCase()} listings`}
            </h3>
            <p className="mb-4">Listings you create show up here.</p>
            <Link href={NEW_LISTING_PATH} className={buttonVariants({ size: "sm" })}>
              <Plus aria-hidden="true" />
              Create job listing
            </Link>
          </div>
        ) : (
          <DataTable label="Listings">
            <thead>
              <tr>
                <Th>Title</Th>
                <Th>Status</Th>
                <Th className="max-sm:hidden">Pay</Th>
                <Th className="text-right">Applicants</Th>
                <Th className="text-right max-sm:hidden">Top match</Th>
                <Th className="max-sm:hidden">Posted</Th>
                <Th>
                  <span className="sr-only">Actions</span>
                </Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((listing) => (
                <ListingRow key={listing.id} listing={listing} />
              ))}
            </tbody>
          </DataTable>
        )}
      </Card>
    </div>
  );
}

function ListingRow({ listing }: { listing: ListingResponse }) {
  const [actionError, setActionError] = useState<string | null>(null);
  const isRemoved = listing.status === "removed";

  return (
    <tr className="relative transition-colors focus-within:bg-primary-soft/30 hover:bg-primary-soft/30">
      <Td className="max-w-80">
        <Link
          href={`/dashboard/recruiter/listings/${listing.id}`}
          className="font-semibold break-words text-ink outline-none after:absolute after:inset-0 hover:text-primary hover:underline focus-visible:after:outline-3 focus-visible:after:-outline-offset-2 focus-visible:after:outline-primary"
        >
          {listing.title}
        </Link>
        <small className="block text-xs break-words text-muted-foreground">
          {listing.location} · {EMPLOYMENT_TYPE_LABELS[listing.employmentType]}
        </small>
        {isRemoved && (
          <small className="block text-xs text-error">
            Removed by an administrator.
            {listing.removalReason ? ` ${listing.removalReason}` : ""}
          </small>
        )}
        {actionError && (
          <small role="alert" className="block text-xs text-error">
            {actionError}
          </small>
        )}
      </Td>
      <Td>
        <ListingStatusBadge status={listing.status} />
      </Td>
      <Td className="whitespace-nowrap max-sm:hidden">
        {listing.salaryMin === null || listing.salaryMax === null ? (
          <span className="text-muted-foreground">Not specified</span>
        ) : (
          formatSalaryRange(listing.salaryMin, listing.salaryMax)
        )}
      </Td>
      <Td className="text-right tabular-nums">{listing.applicantCount}</Td>
      <Td className="text-right tabular-nums max-sm:hidden">
        <TopScore score={listing.topMatchScore} />
      </Td>
      <Td className="whitespace-nowrap max-sm:hidden">{formatDate(listing.createdAt)}</Td>
      <Td className="relative text-right">
        <ListingRowMenu listing={listing} onError={setActionError} />
      </Td>
    </tr>
  );
}
