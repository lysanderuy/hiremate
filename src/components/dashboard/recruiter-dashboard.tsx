"use client";

import Link from "next/link";

import { ApplicationStatusBadge } from "@/components/candidates/application-status-badge";
import { ListingStatusBadge } from "@/components/listings/listing-status-badge";
import { buttonVariants } from "@/components/ui/button";
import { useDashboard } from "@/hooks/use-dashboard";
import { useListings } from "@/hooks/use-listings";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DashboardResponse } from "@/validators/dashboard.validator";

const LISTINGS_PATH = "/dashboard/recruiter/listings";
const CANDIDATES_PATH = "/dashboard/recruiter/candidates";
const MAX_ACTIVE_LISTINGS = 4;

const rowGrid =
  "xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_5rem_8rem] xl:items-center xl:gap-6";

const STAT_TILES: { key: keyof DashboardResponse["stats"]; label: string }[] = [
  { key: "activeJobs", label: "Active listings" },
  { key: "totalApplicants", label: "Total applicants" },
  { key: "shortlisted", label: "Shortlisted" },
  { key: "interviews", label: "Interviews" },
];

function Section({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col rounded-xl border border-border bg-white p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-navy">{title}</h2>
        <Link href={href} className="text-sm font-medium text-primary hover:underline">
          View all
        </Link>
      </div>
      <div className="flex flex-1 flex-col">{children}</div>
    </section>
  );
}

function SectionMessage({ message, isError }: { message: string; isError?: boolean }) {
  return (
    <p
      role={isError ? "alert" : undefined}
      className={cn(
        "flex flex-1 items-center justify-center py-10 text-center text-sm",
        isError ? "text-red-600" : "text-muted-foreground",
      )}
    >
      {message}
    </p>
  );
}

function StatTiles({ stats }: { stats: DashboardResponse["stats"] | undefined }) {
  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {STAT_TILES.map(({ key, label }) => (
        <div key={key} className="rounded-xl border border-border bg-white p-4">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-bold text-navy">{stats ? stats[key] : "—"}</p>
        </div>
      ))}
    </div>
  );
}

function ActiveListings() {
  const { data, isPending, error } = useListings();

  let body: React.ReactNode;
  if (isPending) {
    body = <SectionMessage message="Loading listings..." />;
  } else if (error) {
    body = <SectionMessage message={error.message} isError />;
  } else {
    const open = data.filter((listing) => listing.status === "open").slice(0, MAX_ACTIVE_LISTINGS);
    body =
      open.length === 0 ? (
        <SectionMessage message="No active listings." />
      ) : (
        <ul className="space-y-3">
          {open.map((listing) => (
            <li key={listing.id}>
              <Link
                href={`${LISTINGS_PATH}/${listing.id}`}
                className="block rounded-lg border border-border p-3 transition-colors hover:border-primary"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-sm font-medium text-navy">{listing.title}</span>
                  <ListingStatusBadge status={listing.status} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {listing.applicantCount}{" "}
                  {listing.applicantCount === 1 ? "applicant" : "applicants"}
                  {" · "}Posted {formatDate(listing.createdAt)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      );
  }

  return (
    <Section title="Active listings" href={LISTINGS_PATH}>
      {body}
    </Section>
  );
}

function RecentApplications({
  items,
  isPending,
  errorMessage,
}: {
  items: DashboardResponse["recentApplications"] | undefined;
  isPending: boolean;
  errorMessage: string | undefined;
}) {
  let body: React.ReactNode;
  if (isPending) {
    body = <SectionMessage message="Loading applications..." />;
  } else if (errorMessage || !items) {
    body = <SectionMessage message={errorMessage ?? "Could not load applications."} isError />;
  } else if (items.length === 0) {
    body = <SectionMessage message="No applications yet." />;
  } else {
    body = (
      <div role="table" aria-label="Recent applications" className="space-y-3">
        <div
          role="row"
          className={cn(
            rowGrid,
            "hidden text-xs font-medium tracking-wide text-muted-foreground uppercase xl:px-[calc(1rem+1px)]",
          )}
        >
          <span role="columnheader">Name</span>
          <span role="columnheader">Job</span>
          <span role="columnheader">Match</span>
          <span role="columnheader">Status</span>
        </div>
        <div role="rowgroup" className="space-y-3">
          {items.map((application) => (
            <div
              key={application.id}
              role="row"
              className={cn(
                rowGrid,
                "relative space-y-3 rounded-xl border border-border bg-white p-4 transition-colors focus-within:border-primary hover:border-primary xl:space-y-0",
              )}
            >
              <div role="cell" className="min-w-0 text-sm font-medium text-navy">
                <Link
                  href={`${CANDIDATES_PATH}/${application.id}?listing=${application.jobId}`}
                  className="text-left break-words outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-3 focus-visible:after:ring-ring"
                >
                  {application.applicantName ?? "Unnamed applicant"}
                </Link>
              </div>
              <div role="cell" className="min-w-0 text-sm break-words text-navy">
                {application.jobTitle}
              </div>
              <div role="cell" className="text-sm text-navy">
                <span className="text-muted-foreground xl:hidden">Match: </span>
                {application.matchScore === null ? "—" : `${application.matchScore}%`}
              </div>
              <div role="cell" className="text-sm text-navy">
                <ApplicationStatusBadge status={application.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Section title="Recent applications" href={CANDIDATES_PATH}>
      {body}
    </Section>
  );
}

export function RecruiterDashboard({ name }: { name: string }) {
  const { data, isPending, error } = useDashboard();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-navy">Welcome back, {name}</h1>
          <p className="text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening with your hiring pipeline.
          </p>
        </div>
        <Link
          href={`${LISTINGS_PATH}/new`}
          className={cn(buttonVariants({ size: "lg" }), "h-10 px-4")}
        >
          + Create Job Listing
        </Link>
      </div>
      <StatTiles stats={data?.stats} />
      <div className="grid items-stretch gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <ActiveListings />
        <RecentApplications
          items={data?.recentApplications}
          isPending={isPending}
          errorMessage={error?.message}
        />
      </div>
    </div>
  );
}
