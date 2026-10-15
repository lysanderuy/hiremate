"use client";

import { ChevronDown, Search } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { JobCard } from "@/components/jobs/job-card";
import { FIELD_CLASS } from "@/components/shared/field-label";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDebounce } from "@/hooks/use-debounce";
import { useOpenListings } from "@/hooks/use-open-listings";
import { useResume } from "@/hooks/use-resume";
import {
  MAX_SEARCH_LENGTH,
  buildQuery,
  parseMinPay,
  parseViewState,
  type JobsSort,
  type JobsViewState,
} from "@/lib/jobs/view-state";
import { cn } from "@/lib/utils";
import { EMPLOYMENT_TYPES, EMPLOYMENT_TYPE_LABELS } from "@/types/jobs";

const SORT_TABS: { value: JobsSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "best_match", label: "Best match" },
];

const BEST_MATCH_HINT = "Add a resume to sort by best match";

function currentViewState(): JobsViewState {
  return parseViewState(new URLSearchParams(window.location.search));
}

function Results({
  state,
  sort,
  onPageChange,
  onClear,
}: {
  state: JobsViewState;
  sort: JobsSort;
  onPageChange: (page: number) => void;
  onClear: () => void;
}) {
  const { data, isPending, error, isPlaceholderData } = useOpenListings({
    q: state.q || undefined,
    location: state.location || undefined,
    type: state.type,
    minPay: state.minPay,
    sort,
    page: state.page,
  });

  const lastPage = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;
  const pastEnd = !isPlaceholderData && data !== undefined && state.page > lastPage;
  useEffect(() => {
    if (pastEnd) onPageChange(lastPage);
  }, [pastEnd, lastPage, onPageChange]);

  if (isPending) {
    return (
      <div role="status" aria-label="Loading jobs" className="grid gap-3">
        {[0, 1, 2].map((key) => (
          <div key={key} className="h-32 animate-pulse rounded-xl border border-line bg-white" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <p role="alert" className="rounded-md bg-error-soft px-4 py-3 text-error">
        {error?.message ?? "Could not load jobs."}
      </p>
    );
  }

  const start = (data.page - 1) * data.pageSize;

  return (
    <div aria-busy={isPlaceholderData} className={cn(isPlaceholderData && "opacity-60")}>
      <p aria-live="polite" className="mb-3 min-h-6">
        {data.total} {data.total === 1 ? "job" : "jobs"} found
      </p>
      {data.items.length === 0 ? (
        <Card className="gap-0 py-0">
          <div className="px-5 py-12 text-center">
            <h3 className="mb-2 text-base font-semibold">No listings match your search.</h3>
            <p className="mb-4">Try a different keyword or clear your filters.</p>
            <Button variant="outline" size="sm" onClick={onClear}>
              Clear filters
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <ul className="grid gap-3" aria-label="Jobs">
            {data.items.map((job) => (
              <li key={job.id}>
                <JobCard job={job} />
              </li>
            ))}
          </ul>
          {lastPage > 1 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
              <span aria-live="polite">
                Showing {start + 1} to {start + data.items.length} of {data.total}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="xs"
                  disabled={data.page <= 1}
                  onClick={() => onPageChange(data.page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  disabled={data.page >= lastPage}
                  onClick={() => onPageChange(data.page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function JobsView() {
  const pathname = usePathname();
  const state = parseViewState(useSearchParams());
  const { data: resume, isPending: resumePending } = useResume();

  const [inputs, setInputs] = useState({
    q: state.q,
    location: state.location,
    minPay: state.minPay === undefined ? "" : String(state.minPay),
  });
  const debounced = useDebounce(inputs);

  function replaceUrl(next: JobsViewState) {
    const query = buildQuery(next);
    window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
  }

  useEffect(() => {
    const current = currentViewState();
    const q = debounced.q.trim();
    const location = debounced.location.trim();
    const minPay = parseMinPay(debounced.minPay);
    if (q === current.q && location === current.location && minPay === current.minPay) return;
    const query = buildQuery({ ...current, q, location, minPay, page: 1 });
    window.history.replaceState(null, "", query ? `${pathname}?${query}` : pathname);
  }, [debounced, pathname]);

  function navigate(next: Partial<JobsViewState>) {
    replaceUrl({ ...currentViewState(), page: 1, ...next });
  }

  function changePage(page: number) {
    replaceUrl({ ...currentViewState(), page });
  }

  function clearFilters() {
    setInputs({ q: "", location: "", minPay: "" });
    replaceUrl({
      q: "",
      location: "",
      type: undefined,
      minPay: undefined,
      sort: currentViewState().sort,
      page: 1,
    });
  }

  const canBestMatch = resume?.state === "ready";
  const sort: JobsSort = state.sort === "best_match" && !canBestMatch ? "newest" : state.sort;
  const filtersActive =
    state.q !== "" ||
    state.location !== "" ||
    state.type !== undefined ||
    state.minPay !== undefined;
  const waitingForResume = state.sort === "best_match" && resumePending;

  return (
    <div>
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-60 flex-1">
            <label htmlFor="jobs-search" className="sr-only">
              Search
            </label>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-muted-foreground"
            />
            <input
              id="jobs-search"
              type="search"
              value={inputs.q}
              maxLength={MAX_SEARCH_LENGTH}
              onChange={(event) => setInputs({ ...inputs, q: event.target.value })}
              placeholder="Search by title, company or keyword"
              className={cn(FIELD_CLASS, "pl-10.5")}
            />
          </div>
          <div
            role="group"
            aria-label="Sort jobs"
            className="inline-flex gap-1 rounded-md border border-line bg-white p-1"
          >
            {SORT_TABS.map((tab) => {
              const selected = sort === tab.value;
              const disabled = tab.value === "best_match" && !canBestMatch;
              return (
                <button
                  key={tab.value}
                  type="button"
                  aria-pressed={selected}
                  disabled={disabled}
                  title={disabled ? BEST_MATCH_HINT : undefined}
                  onClick={() => navigate({ sort: tab.value })}
                  className={cn(
                    "h-8 rounded-lg px-4 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                    selected ? "bg-primary-soft text-primary" : "text-text enabled:hover:bg-page",
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-40 flex-1 sm:max-w-56">
            <label htmlFor="jobs-location" className="sr-only">
              Location
            </label>
            <input
              id="jobs-location"
              type="text"
              value={inputs.location}
              maxLength={MAX_SEARCH_LENGTH}
              onChange={(event) => setInputs({ ...inputs, location: event.target.value })}
              placeholder="Any location"
              className={FIELD_CLASS}
            />
          </div>
          <div className="relative min-w-40 flex-1 sm:max-w-48">
            <label htmlFor="jobs-type" className="sr-only">
              Employment type
            </label>
            <select
              id="jobs-type"
              value={state.type ?? ""}
              onChange={(event) =>
                navigate({ type: EMPLOYMENT_TYPES.find((type) => type === event.target.value) })
              }
              className={cn(FIELD_CLASS, "appearance-none pr-10")}
            >
              <option value="">All types</option>
              {EMPLOYMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {EMPLOYMENT_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-muted-foreground"
            />
          </div>
          <div className="relative min-w-40 flex-1 sm:max-w-52">
            <label htmlFor="jobs-min-pay" className="sr-only">
              Minimum pay per month
            </label>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm text-muted-foreground"
            >
              Min PHP
            </span>
            <input
              id="jobs-min-pay"
              type="text"
              inputMode="numeric"
              value={inputs.minPay}
              onChange={(event) =>
                setInputs({ ...inputs, minPay: event.target.value.replace(/\D/g, "") })
              }
              placeholder="Any amount"
              className={cn(FIELD_CLASS, "pl-20")}
            />
          </div>
          {filtersActive && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {waitingForResume ? (
        <div
          role="status"
          aria-label="Loading jobs"
          className="h-32 animate-pulse rounded-xl border border-line bg-white"
        />
      ) : (
        <Results state={state} sort={sort} onPageChange={changePage} onClear={clearFilters} />
      )}
    </div>
  );
}
