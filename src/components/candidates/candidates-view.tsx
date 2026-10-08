"use client";

import { ChevronDown, Users, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { ApplicationStatusBadge } from "@/components/candidates/application-status-badge";
import { FieldLabel } from "@/components/shared/field-label";
import { buttonVariants } from "@/components/ui/button";
import { useApplications } from "@/hooks/use-applications";
import { useDebounce } from "@/hooks/use-debounce";
import { useListings } from "@/hooks/use-listings";
import {
  MAX_SEARCH_LENGTH,
  buildQuery,
  parseViewState,
  type StatusFilter,
  type ViewState,
} from "@/lib/candidates/view-state";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { APPLICATION_STATUSES, APPLICATION_STATUS_LABELS } from "@/types/applications";
import type { ApplicationSummaryResponse } from "@/validators/application.validator";

const NEW_LISTING_PATH = "/dashboard/recruiter/listings/new";
const CANDIDATES_PATH = "/dashboard/recruiter/candidates";

const rowGrid =
  "xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_5rem_8rem_8rem] xl:items-center xl:gap-6";

const TOOL_WIDTH = "min-w-0 flex-1 sm:w-40 sm:flex-none";

const fieldClassName =
  "h-11 w-full rounded-lg border border-border bg-white px-3 text-sm text-navy outline-none transition-colors placeholder:text-slate-400 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring disabled:bg-slate-50 disabled:text-slate-500";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: undefined, label: "All" },
  ...APPLICATION_STATUSES.map((value) => ({ value, label: APPLICATION_STATUS_LABELS[value] })),
];

const LISTING_STATUS_SUFFIX: Record<string, string> = {
  closed: " (Closed)",
  removed: " (Removed)",
};

function EmptyState({ message, showPostLink }: { message: string; showPostLink?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white px-6 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-tint text-primary">
        <Users className="size-6" />
      </span>
      <p className="mt-4 text-sm text-muted-foreground">{message}</p>
      {showPostLink ? (
        <Link href={NEW_LISTING_PATH} className={cn(buttonVariants(), "mt-4 h-9 px-4")}>
          + Create Job Listing
        </Link>
      ) : null}
    </div>
  );
}

function ApplicationsList({
  data,
  isPending,
  errorMessage,
  filtersActive,
  queryString,
  jobTitle,
}: {
  data: ApplicationSummaryResponse[] | undefined;
  isPending: boolean;
  errorMessage: string | undefined;
  filtersActive: boolean;
  queryString: string;
  jobTitle: string;
}) {
  if (isPending) {
    return (
      <div className="space-y-3" role="status" aria-label="Loading applicants">
        {[0, 1, 2].map((key) => (
          <div key={key} className="h-24 animate-pulse rounded-xl border border-border bg-white" />
        ))}
      </div>
    );
  }

  if (errorMessage || !data) {
    return (
      <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
        {errorMessage ?? "Could not load applicants."}
      </p>
    );
  }

  if (data.length === 0) {
    return (
      <EmptyState
        message={filtersActive ? "No applicants match your filters." : "No applicants yet."}
      />
    );
  }

  return (
    <div role="table" aria-label="Applicants" className="space-y-3">
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
        <span role="columnheader">Applied</span>
      </div>
      <div role="rowgroup" className="space-y-3">
        {data.map((application) => (
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
                href={`${CANDIDATES_PATH}/${application.id}?${queryString}`}
                className="text-left break-words outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-3 focus-visible:after:ring-ring"
              >
                {application.applicantName ?? "Unnamed applicant"}
              </Link>
            </div>
            <div role="cell" className="min-w-0 text-sm break-words text-navy">
              {jobTitle}
            </div>
            <div role="cell" className="text-sm text-navy">
              <span className="text-muted-foreground xl:hidden">Match: </span>
              {application.matchScore === null ? "—" : `${application.matchScore}%`}
            </div>
            <div role="cell" className="text-sm text-navy">
              <ApplicationStatusBadge status={application.status} />
            </div>
            <div role="cell" className="text-sm text-navy">
              <span className="text-muted-foreground xl:hidden">Applied: </span>
              {formatDate(application.createdAt)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type Listing = NonNullable<ReturnType<typeof useListings>["data"]>[number];

function SkillsFilter({
  options,
  selected,
  onChange,
  className,
}: {
  options: string[];
  selected: string[];
  onChange: (skills: string[]) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const disabled = options.length === 0;

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function toggle(skill: string, checked: boolean) {
    const next = new Set(selected);
    if (checked) next.add(skill);
    else next.delete(skill);
    onChange(options.filter((option) => next.has(option)));
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative", className)}
      onBlur={(event) => {
        const next = event.relatedTarget;
        if (next instanceof Node && !event.currentTarget.contains(next)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        aria-expanded={open && !disabled}
        aria-controls={open && !disabled ? panelId : undefined}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "inline-flex h-11 w-full items-center justify-between gap-2 rounded-lg border px-3 text-sm outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring disabled:bg-slate-50 disabled:text-slate-500",
          selected.length > 0
            ? "border-primary bg-tint text-primary"
            : "border-border bg-white text-navy hover:border-primary disabled:hover:border-border",
        )}
      >
        {selected.length > 0 ? `Skills (${selected.length})` : "Skills"}
        <ChevronDown className="size-4" aria-hidden="true" />
      </button>
      {open && !disabled ? (
        <div
          id={panelId}
          role="group"
          aria-label="Skills"
          className="absolute top-full left-0 z-20 mt-2 max-h-64 w-64 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-lg border border-border bg-white p-1 shadow-lg sm:right-0 sm:left-auto"
        >
          {options.map((skill) => (
            <label
              key={skill}
              className="flex min-h-9 cursor-pointer items-center gap-2.5 rounded-md px-2.5 text-sm break-all text-navy hover:bg-tint"
            >
              <input
                type="checkbox"
                checked={selected.includes(skill)}
                onChange={(event) => toggle(skill, event.target.checked)}
                className="size-4 shrink-0 accent-primary"
              />
              {skill}
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function CandidatesContent({
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
      listings[0]
    );
  }

  const listing = resolveListing(searchParams.get("listing"));
  const listingSkills = listing.skills.map((skill) => skill.name);
  const state = parseViewState(searchParams, listing.id, listingSkills);
  const queryString = buildQuery(state);

  const [searchInput, setSearchInput] = useState(state.q);
  const debouncedSearch = useDebounce(searchInput.trim());
  const lastPushedQ = useRef(state.q);
  const searchInputRef = useRef(searchInput);

  function readCurrentState(): ViewState {
    const params = new URLSearchParams(window.location.search);
    const current = resolveListing(params.get("listing"));
    return parseViewState(
      params,
      current.id,
      current.skills.map((skill) => skill.name),
    );
  }

  function replaceUrl(next: ViewState) {
    window.history.replaceState(null, "", `${pathname}?${buildQuery(next)}`);
  }

  function navigate(next: Partial<ViewState>) {
    if (next.q !== undefined) lastPushedQ.current = next.q;
    replaceUrl({ ...readCurrentState(), ...next });
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
    skills: state.skills,
    sort: state.sort,
  });

  function handleListingChange(id: string) {
    setSearchInput("");
    lastPushedQ.current = "";
    replaceUrl({ listing: id, status: undefined, q: "", sort: "newest", skills: [] });
  }

  function clearFilters() {
    setSearchInput("");
    navigate({ status: undefined, q: "", skills: [] });
  }

  const filtersActive = state.status !== undefined || state.q !== "" || state.skills.length > 0;
  const itemCount = data?.items.length;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <div className="space-y-1.5">
          <FieldLabel htmlFor="candidates-listing">Listing</FieldLabel>
          <select
            id="candidates-listing"
            value={listing.id}
            onChange={(event) => handleListingChange(event.target.value)}
            className={fieldClassName}
          >
            {listings.map((option) => (
              <option key={option.id} value={option.id}>
                {option.title}
                {LISTING_STATUS_SUFFIX[option.status] ?? ""}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <FieldLabel htmlFor="candidates-search">Search</FieldLabel>
          <input
            id="candidates-search"
            type="search"
            value={searchInput}
            maxLength={MAX_SEARCH_LENGTH}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Enter applicant name"
            className={fieldClassName}
          />
        </div>
      </div>

      <div
        role="group"
        aria-label="Filter by status"
        className="-mx-1 flex gap-2 overflow-x-auto px-1 py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {STATUS_FILTERS.map((filter) => {
          const pressed = filter.value === state.status;
          const count = data?.counts[filter.value ?? "all"];
          return (
            <button
              key={filter.label}
              type="button"
              aria-pressed={pressed}
              onClick={() => navigate({ status: filter.value })}
              className={cn(
                "inline-flex min-h-9 shrink-0 items-center rounded-full border px-4 text-sm whitespace-nowrap outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring",
                pressed
                  ? "border-primary bg-tint text-primary"
                  : "border-border bg-white text-navy hover:border-primary",
              )}
            >
              {filter.label}
              {count === undefined ? null : (
                <span
                  className={cn("ml-1.5", pressed ? "text-primary/70" : "text-muted-foreground")}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-h-6 items-center gap-3">
          <p aria-live="polite" className="text-sm text-muted-foreground">
            {itemCount === undefined
              ? ""
              : `${itemCount} ${itemCount === 1 ? "applicant" : "applicants"}`}
          </p>
          {filtersActive ? (
            <button
              type="button"
              onClick={clearFilters}
              className="rounded-sm text-sm font-medium text-primary outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring"
            >
              Clear filters
            </button>
          ) : null}
        </div>
        <div className="flex w-full items-center gap-3 sm:w-auto">
          <SkillsFilter
            options={listingSkills}
            selected={state.skills}
            onChange={(skills) => navigate({ skills })}
            className={TOOL_WIDTH}
          />
          <div className={TOOL_WIDTH}>
            <label htmlFor="candidates-sort" className="sr-only">
              Sort
            </label>
            <select
              id="candidates-sort"
              value={state.sort}
              onChange={(event) =>
                navigate({ sort: event.target.value === "oldest" ? "oldest" : "newest" })
              }
              className={fieldClassName}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        </div>
      </div>

      {state.skills.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {state.skills.map((skill) => (
            <button
              key={skill}
              type="button"
              aria-label={`Remove ${skill}`}
              onClick={() => navigate({ skills: state.skills.filter((s) => s !== skill) })}
              className="inline-flex min-h-8 max-w-full items-center gap-1.5 rounded-full bg-tint px-3 text-sm text-primary outline-none focus-visible:ring-3 focus-visible:ring-ring"
            >
              <span className="break-all">{skill}</span>
              <X className="size-3.5 shrink-0" aria-hidden="true" />
            </button>
          ))}
        </div>
      ) : null}

      <div aria-busy={isPlaceholderData} className={cn(isPlaceholderData && "opacity-60")}>
        <ApplicationsList
          data={data?.items}
          isPending={isPending}
          errorMessage={error?.message}
          filtersActive={filtersActive}
          queryString={queryString}
          jobTitle={listing.title}
        />
      </div>
    </div>
  );
}

export function CandidatesView({ initialListingId }: { initialListingId?: string }) {
  const { data: listings, isPending, error } = useListings();

  if (isPending) {
    return (
      <div className="space-y-3" role="status" aria-label="Loading candidates">
        <div className="h-11 animate-pulse rounded-lg border border-border bg-white" />
        <div className="h-24 animate-pulse rounded-xl border border-border bg-white" />
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

  if (listings.length === 0) {
    return <EmptyState message="You have no listings yet." showPostLink />;
  }

  return <CandidatesContent listings={listings} initialListingId={initialListingId} />;
}
