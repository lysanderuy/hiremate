"use client";

import { Plus } from "lucide-react";
import Link from "next/link";

import { Avatar } from "@/components/shared/avatar";
import { DataTable, Td, Th } from "@/components/shared/data-table";
import { ScoreCell } from "@/components/shared/match-score";
import { PageHeader } from "@/components/shared/page-header";
import { ApplicationStatusPill } from "@/components/shared/status-pill";
import { ListingStatusBadge } from "@/components/listings/listing-status-badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDashboard } from "@/hooks/use-dashboard";
import { useListings } from "@/hooks/use-listings";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DashboardResponse } from "@/validators/dashboard.validator";

const BASE_PATH = "/dashboard/recruiter";
const LISTINGS_PATH = `${BASE_PATH}/listings`;
const APPLICANTS_PATH = `${BASE_PATH}/applicants`;
const MAX_LISTINGS_SHOWN = 5;

const STAT_TILES: { key: keyof DashboardResponse["stats"]; label: string }[] = [
  { key: "activeJobs", label: "Open listings" },
  { key: "totalApplicants", label: "Total applications" },
  { key: "last7Days", label: "Last 7 days" },
  { key: "shortlisted", label: "Shortlisted" },
];

function SectionCard({
  title,
  href,
  children,
}: {
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="gap-0 py-0">
      <div className="flex items-center justify-between gap-4 px-5 pt-5 pb-3">
        <h2 className="text-base font-semibold tracking-[-0.01em]">{title}</h2>
        <Link href={href} className="text-sm font-medium text-primary hover:underline">
          View all
        </Link>
      </div>
      {children}
    </Card>
  );
}

function SectionMessage({ message, isError }: { message: string; isError?: boolean }) {
  return (
    <p
      role={isError ? "alert" : undefined}
      className={cn(
        "border-t border-line px-5 py-10 text-center",
        isError ? "text-error" : "text-muted-foreground",
      )}
    >
      {message}
    </p>
  );
}

function StatTiles({ stats }: { stats: DashboardResponse["stats"] | undefined }) {
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 min-[641px]:gap-4 min-[1101px]:grid-cols-4">
      {STAT_TILES.map(({ key, label }) => (
        <Card key={key} className="gap-0 p-4 min-[641px]:p-5">
          <span className="text-sm text-muted-foreground">{label}</span>
          {stats ? (
            <b className="mt-1 font-display text-3xl font-semibold tracking-[-0.03em] text-ink tabular-nums">
              {stats[key]}
            </b>
          ) : (
            <span
              role="status"
              aria-label={`Loading ${label}`}
              className="mt-2 block h-9 w-14 animate-pulse rounded-md bg-weak-soft"
            />
          )}
        </Card>
      ))}
    </div>
  );
}

function YourListings() {
  const { data, isPending, error } = useListings();

  let body: React.ReactNode;
  if (isPending) {
    body = <SectionMessage message="Loading listings..." />;
  } else if (error) {
    body = <SectionMessage message={error.message} isError />;
  } else {
    const shown = data
      .filter((listing) => listing.status !== "removed")
      .slice(0, MAX_LISTINGS_SHOWN);
    body =
      shown.length === 0 ? (
        <SectionMessage message="No listings yet. Create one to start receiving applications." />
      ) : (
        <ul>
          {shown.map((listing) => (
            <li key={listing.id}>
              <Link
                href={`${APPLICANTS_PATH}?listing=${listing.id}`}
                className="flex items-center justify-between gap-3 border-t border-line px-5 py-4 transition-colors hover:bg-primary-soft/30"
              >
                <span className="min-w-0">
                  <b className="block font-semibold break-words text-ink">{listing.title}</b>
                  <small className="text-muted-foreground">
                    {listing.applicantCount}{" "}
                    {listing.applicantCount === 1 ? "applicant" : "applicants"}
                    {listing.topMatchScore !== null && ` · Top match ${listing.topMatchScore}/100`}
                  </small>
                </span>
                <ListingStatusBadge status={listing.status} />
              </Link>
            </li>
          ))}
        </ul>
      );
  }

  return (
    <SectionCard title="Your listings" href={LISTINGS_PATH}>
      {body}
    </SectionCard>
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
    body = (
      <SectionMessage message="No applications yet. They show up here as soon as someone applies." />
    );
  } else {
    body = (
      <DataTable label="Recent applications" className="min-w-0">
        <thead>
          <tr>
            <Th>Applicant</Th>
            <Th className="max-sm:hidden">Listing</Th>
            <Th>Match</Th>
            <Th>Status</Th>
          </tr>
        </thead>
        <tbody>
          {items.map((application) => {
            const name = application.applicantName ?? "Unnamed applicant";
            return (
              <tr
                key={application.id}
                className="relative transition-colors focus-within:bg-primary-soft/30 hover:bg-primary-soft/30"
              >
                <Td>
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={name} />
                    <div className="min-w-0">
                      <Link
                        href={`${APPLICANTS_PATH}/${application.id}?listing=${application.jobId}`}
                        className="block font-semibold break-words text-ink outline-none after:absolute after:inset-0 focus-visible:after:outline-3 focus-visible:after:-outline-offset-2 focus-visible:after:outline-primary"
                      >
                        {name}
                      </Link>
                      <small className="text-xs text-muted-foreground">
                        {formatDate(application.createdAt)}
                      </small>
                    </div>
                  </div>
                </Td>
                <Td className="max-sm:hidden">{application.jobTitle}</Td>
                <Td>
                  <ScoreCell score={application.matchScore} />
                </Td>
                <Td>
                  <ApplicationStatusPill status={application.status} />
                </Td>
              </tr>
            );
          })}
        </tbody>
      </DataTable>
    );
  }

  return (
    <SectionCard title="Recent applications" href={APPLICANTS_PATH}>
      {body}
    </SectionCard>
  );
}

export function RecruiterDashboard({ name }: { name: string }) {
  const { data, isPending, error } = useDashboard();
  const firstName = name.trim().split(/\s+/)[0] || "there";
  const waiting = data?.stats.awaitingReview ?? 0;

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Here is what is happening with your listings."
        action={
          <Link href={`${LISTINGS_PATH}/new`} className={buttonVariants({ size: "sm" })}>
            <Plus aria-hidden="true" />
            Create job listing
          </Link>
        }
      />
      {waiting > 0 && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-primary-soft px-5 py-4 font-medium text-ink">
          <span>
            {waiting} {waiting === 1 ? "application is" : "applications are"} waiting to be viewed.
          </span>
          <Link
            href={`${APPLICANTS_PATH}?status=submitted`}
            className={buttonVariants({ size: "xs" })}
          >
            Review now
          </Link>
        </div>
      )}
      <StatTiles stats={data?.stats} />
      <div className="grid items-start gap-6 min-[1101px]:grid-cols-[1fr_1.6fr]">
        <YourListings />
        <RecentApplications
          items={data?.recentApplications}
          isPending={isPending}
          errorMessage={error?.message}
        />
      </div>
    </div>
  );
}
