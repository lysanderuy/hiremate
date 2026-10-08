"use client";

import { ChevronDown, Search } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { MissingChip, MoreChip } from "@/components/applicants/skill-chip";
import { Avatar } from "@/components/shared/avatar";
import { DataTable, Td, Th } from "@/components/shared/data-table";
import { FIELD_CLASS, FieldLabel } from "@/components/shared/field-label";
import { MATCH_BAND_LABELS, ScoreCell } from "@/components/shared/match-score";
import { ApplicationStatusPill } from "@/components/shared/status-pill";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useApplications } from "@/hooks/use-applications";
import { useDebounce } from "@/hooks/use-debounce";
import { useListings } from "@/hooks/use-listings";
import {
  BAND_VALUES,
  MAX_SEARCH_LENGTH,
  PAGE_SIZE,
  SORT_VALUES,
  buildQuery,
  parseViewState,
  type SortValue,
  type StatusFilter,
  type ViewState,
} from "@/lib/applicants/view-state";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { APPLICATION_STATUSES, APPLICATION_STATUS_LABELS } from "@/types/applications";
import type { ApplicationSummaryResponse } from "@/validators/application.validator";

const NEW_LISTING_PATH = "/dashboard/recruiter/listings/new";
const APPLICANTS_PATH = "/dashboard/recruiter/applicants";
const MAX_MISSING_CHIPS = 2;

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: undefined, label: "All" },
  ...APPLICATION_STATUSES.map((value) => ({ value, label: APPLICATION_STATUS_LABELS[value] })),
];

const SORT_LABELS: Record<SortValue, string> = {
  match: "Match, high to low",
  newest: "Newest first",
  name: "Name, A to Z",
};

const LISTING_STATUS_SUFFIX: Record<string, string> = {
  closed: " (Closed)",
  removed: " (Removed)",
};

const DEFAULT_STATE = {
  status: undefined,
  q: "",
  band: undefined,
  sort: "match",
  page: 1,
} satisfies Omit<ViewState, "listing">;

type Listing = NonNullable<ReturnType<typeof useListings>["data"]>[number];

function SelectField({
  id,
  label,
  hideLabel,
  value,
  onChange,
  className,
  children,
}: {
  id: string;
  label: string;
  hideLabel?: boolean;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {hideLabel ? (
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
      ) : (
        <FieldLabel htmlFor={id}>{label}</FieldLabel>
      )}
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cn(FIELD_CLASS, "appearance-none pr-10")}
        >
          {children}
        </select>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-muted-foreground"
        />
      </div>
    </div>
  );
}

function EmptyCard({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="gap-0 py-0">
      <div className="px-5 py-12 text-center">
        <h3 className="mb-2 text-base font-semibold">{title}</h3>
        <p className="mb-4">{message}</p>
        {action}
      </div>
    </Card>
  );
}

function MissingSkills({ skills }: { skills: string[] }) {
  if (skills.length === 0) return <span className="text-muted-foreground">None</span>;

  return (
    <ul aria-label="Missing skills" className="flex flex-wrap gap-2">
      {skills.slice(0, MAX_MISSING_CHIPS).map((skill) => (
        <MissingChip key={skill}>{skill}</MissingChip>
      ))}
      {skills.length > MAX_MISSING_CHIPS && <MoreChip count={skills.length - MAX_MISSING_CHIPS} />}
    </ul>
  );
}

function ApplicantRow({
  application,
  href,
}: {
  application: ApplicationSummaryResponse;
  href: string;
}) {
  const name = application.applicantName ?? "Unnamed applicant";
  const totalSkills = application.skillsMatched.length + application.skillsMissing.length;

  return (
    <tr className="relative transition-colors focus-within:bg-primary-soft/30 hover:bg-primary-soft/30">
      <Td>
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={name} />
          <div className="min-w-0">
            <Link
              href={href}
              className="block font-semibold break-words text-ink outline-none after:absolute after:inset-0 hover:text-primary focus-visible:after:outline-3 focus-visible:after:-outline-offset-2 focus-visible:after:outline-primary"
            >
              {name}
            </Link>
            <small className="block text-xs text-muted-foreground">
              {application.skillsMatched.length} of {totalSkills} skills
            </small>
          </div>
        </div>
      </Td>
      <Td className="whitespace-nowrap">
        <ScoreCell score={application.matchScore} />
      </Td>
      <Td className="max-sm:hidden">
        <MissingSkills skills={application.skillsMissing} />
      </Td>
      <Td>
        <ApplicationStatusPill status={application.status} />
      </Td>
      <Td className="whitespace-nowrap max-sm:hidden">{formatDate(application.createdAt)}</Td>
    </tr>
  );
}

function ApplicantsTable({
  items,
  page,
  sort,
  queryString,
  onPageChange,
}: {
  items: ApplicationSummaryResponse[];
  page: number;
  sort: SortValue;
  queryString: string;
  onPageChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const start = (current - 1) * PAGE_SIZE;
  const rows = items.slice(start, start + PAGE_SIZE);

  return (
    <Card className="gap-0 py-0">
      <DataTable label="Applicants">
        <thead>
          <tr>
            <Th>Applicant</Th>
            <Th>Match{sort === "match" ? " ↓" : ""}</Th>
            <Th className="max-sm:hidden">Missing skills</Th>
            <Th>Status</Th>
            <Th className="max-sm:hidden">Applied</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((application) => (
            <ApplicantRow
              key={application.id}
              application={application}
              href={`${APPLICANTS_PATH}/${application.id}?${queryString}`}
            />
          ))}
        </tbody>
      </DataTable>
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line px-5 py-3 text-sm text-muted-foreground">
        <span aria-live="polite">
          Showing {start + 1} to {start + rows.length} of {items.length}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="xs"
            disabled={current <= 1}
            onClick={() => onPageChange(current - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="xs"
            disabled={current >= pages}
            onClick={() => onPageChange(current + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </Card>
  );
}

function ApplicantsContent({
  listings,
  initialListingId,
}: {
  listings: Listing[];
  initialListingId?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function resolveListing(listingParam: string | null): Listing {
    return (
      listings.find((l) => l.id === listingParam) ??
      listings.find((l) => l.id === initialListingId) ??
      listings.find((l) => l.status === "open") ??
      listings[0]
    );
  }

  const listing = resolveListing(searchParams.get("listing"));
  const state = parseViewState(searchParams, listing.id);
  const queryString = buildQuery(state);

  const [searchInput, setSearchInput] = useState(state.q);
  const debouncedSearch = useDebounce(searchInput.trim());
  const lastPushedQ = useRef(state.q);
  const searchInputRef = useRef(searchInput);

  function readCurrentState(): ViewState {
    const params = new URLSearchParams(window.location.search);
    return parseViewState(params, resolveListing(params.get("listing")).id);
  }

  function replaceUrl(next: ViewState) {
    window.history.replaceState(null, "", `${pathname}?${buildQuery(next)}`);
  }

  function navigate(next: Partial<ViewState>) {
    if (next.q !== undefined) lastPushedQ.current = next.q;
    replaceUrl({ ...readCurrentState(), page: 1, ...next });
  }

  const latest = useRef({ readCurrentState, navigate });
  useEffect(() => {
    latest.current = { readCurrentState, navigate };
    searchInputRef.current = searchInput;
  });
  useEffect(() => {
    if (debouncedSearch !== latest.current.readCurrentState().q) {
      latest.current.navigate({ q: debouncedSearch });
    }
  }, [debouncedSearch]);

  const urlQ = state.q;
  useEffect(() => {
    if (urlQ !== lastPushedQ.current && urlQ !== searchInputRef.current.trim()) {
      setSearchInput(urlQ);
    }
    lastPushedQ.current = urlQ;
  }, [urlQ]);

  const { data, isPending, error, isPlaceholderData } = useApplications(listing.id, {
    status: state.status,
    search: state.q,
    band: state.band,
    sort: state.sort,
  });

  function handleListingChange(id: string) {
    setSearchInput("");
    lastPushedQ.current = "";
    replaceUrl({ listing: id, ...DEFAULT_STATE });
  }

  function clearFilters() {
    setSearchInput("");
    navigate({ status: undefined, q: "", band: undefined });
  }

  const filtersActive = state.status !== undefined || state.q !== "" || state.band !== undefined;
  const itemCount = data?.items.length;

  return (
    <div>
      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <SelectField
          id="applicants-listing"
          label="Listing"
          value={listing.id}
          onChange={handleListingChange}
        >
          {listings.map((option) => (
            <option key={option.id} value={option.id}>
              {option.title}
              {LISTING_STATUS_SUFFIX[option.status] ?? ""}
            </option>
          ))}
        </SelectField>
        <div className="space-y-1.5">
          <FieldLabel htmlFor="applicants-search">Search</FieldLabel>
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-muted-foreground"
            />
            <input
              id="applicants-search"
              type="search"
              value={searchInput}
              maxLength={MAX_SEARCH_LENGTH}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by applicant name"
              className={cn(FIELD_CLASS, "pl-10.5")}
            />
          </div>
        </div>
      </div>

      <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => {
          const pressed = filter.value === state.status;
          const total = data?.counts[filter.value ?? "all"];
          return (
            <button
              key={filter.label}
              type="button"
              aria-pressed={pressed}
              onClick={() => navigate({ status: filter.value })}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors",
                pressed
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-line bg-white hover:border-muted-foreground",
              )}
            >
              {filter.label}
              {total !== undefined && (
                <small
                  className={cn("font-medium", pressed ? "text-primary" : "text-muted-foreground")}
                >
                  {total}
                </small>
              )}
            </button>
          );
        })}
      </div>

      <div className="my-4 flex flex-wrap items-center justify-between gap-4">
        <p aria-live="polite" className="min-h-6">
          {itemCount === undefined
            ? ""
            : `${itemCount} ${itemCount === 1 ? "applicant" : "applicants"}`}
        </p>
        <div className="flex flex-wrap gap-3">
          <SelectField
            id="applicants-band"
            label="Filter by band"
            hideLabel
            value={state.band ?? ""}
            onChange={(value) => navigate({ band: BAND_VALUES.find((band) => band === value) })}
            className="min-w-44"
          >
            <option value="">All bands</option>
            {BAND_VALUES.map((band) => (
              <option key={band} value={band}>
                {MATCH_BAND_LABELS[band]}
              </option>
            ))}
          </SelectField>
          <SelectField
            id="applicants-sort"
            label="Sort"
            hideLabel
            value={state.sort}
            onChange={(value) =>
              navigate({ sort: SORT_VALUES.find((sort) => sort === value) ?? "match" })
            }
            className="min-w-48"
          >
            {SORT_VALUES.map((sort) => (
              <option key={sort} value={sort}>
                {SORT_LABELS[sort]}
              </option>
            ))}
          </SelectField>
        </div>
      </div>

      <div aria-busy={isPlaceholderData} className={cn(isPlaceholderData && "opacity-60")}>
        {isPending ? (
          <div role="status" aria-label="Loading applicants">
            <div className="h-72 animate-pulse rounded-xl border border-line bg-white" />
          </div>
        ) : error || !data ? (
          <p role="alert" className="rounded-md bg-error-soft px-4 py-3 text-error">
            {error?.message ?? "Could not load applicants."}
          </p>
        ) : data.items.length === 0 ? (
          filtersActive ? (
            <EmptyCard
              title="No applicants found"
              message="Try another filter, or clear the search."
              action={
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyCard
              title="No applicants yet"
              message="Applicants show up here after they apply to this listing."
            />
          )
        ) : (
          <ApplicantsTable
            items={data.items}
            page={state.page}
            sort={state.sort}
            queryString={queryString}
            onPageChange={(page) => navigate({ page })}
          />
        )}
      </div>
    </div>
  );
}

export function ApplicantsView({ initialListingId }: { initialListingId?: string }) {
  const { data: listings, isPending, error } = useListings();

  if (isPending) {
    return (
      <div role="status" aria-label="Loading applicants" className="space-y-3">
        <div className="h-10 animate-pulse rounded-md border border-line bg-white" />
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

  if (listings.length === 0) {
    return (
      <EmptyCard
        title="No listings yet"
        message="Create a listing to start receiving applicants."
        action={
          <Link href={NEW_LISTING_PATH} className={buttonVariants({ size: "sm" })}>
            Create job listing
          </Link>
        }
      />
    );
  }

  return <ApplicantsContent listings={listings} initialListingId={initialListingId} />;
}
