"use client";

import { Search } from "lucide-react";
import { useState } from "react";

import { ListingStatusPill } from "@/components/admin/admin-status";
import { RESTORED_MESSAGE, ListingDrawer } from "@/components/admin/listing-drawer";
import { RemoveListingDialog } from "@/components/admin/remove-listing-dialog";
import { ClickableRow } from "@/components/shared/clickable-row";
import { DataTable, Td, Th } from "@/components/shared/data-table";
import { FIELD_CLASS } from "@/components/shared/field-label";
import { TablePager } from "@/components/shared/table-pager";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAdminListings } from "@/hooks/use-admin-listings";
import { useDebounce } from "@/hooks/use-debounce";
import { useRestoreListing } from "@/hooks/use-restore-listing";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useToastStore } from "@/stores/toast.store";
import { JOB_STATUSES, type JobStatus } from "@/types/jobs";
import type { AdminListingResponse } from "@/validators/admin-listing.validator";

export type ListingsInitialFilter = "empty" | "preparing" | undefined;

const TABS = [undefined, ...JOB_STATUSES] as const;

const TAB_LABELS: Record<JobStatus | "all", string> = {
  all: "All",
  open: "Open",
  closed: "Closed",
  removed: "Removed",
};

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-5.5 items-center rounded-sm border border-line bg-white px-2 text-xs font-medium whitespace-nowrap text-muted-foreground">
      {children}
    </span>
  );
}

function FilterChip({
  pressed,
  onToggle,
  children,
}: {
  pressed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onToggle}
      className={cn(
        "inline-flex h-10 items-center rounded-full border px-4 font-medium transition-colors",
        pressed
          ? "border-primary bg-primary-soft text-primary"
          : "border-line bg-white text-ink hover:border-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function ListingsView({ initialFilter }: { initialFilter: ListingsInitialFilter }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<JobStatus | undefined>();
  const [noApplications, setNoApplications] = useState(initialFilter === "empty");
  const [preparing, setPreparing] = useState(initialFilter === "preparing");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const q = useDebounce(search.trim());

  const { data, isPending, error } = useAdminListings({
    q,
    status,
    noApplications: noApplications || undefined,
    preparing: preparing || undefined,
    page,
  });
  const restore = useRestoreListing();
  const showToast = useToastStore((state) => state.show);

  function clearFilters() {
    setSearch("");
    setStatus(undefined);
    setNoApplications(false);
    setPreparing(false);
    setPage(1);
  }

  function handleRestore(listing: AdminListingResponse) {
    restore.mutate(listing.id, {
      onSuccess: () => showToast(RESTORED_MESSAGE),
      onError: (mutationError) => showToast(mutationError.message),
    });
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Filter listings by status"
          className="inline-flex gap-1 rounded-md border border-line bg-white p-1"
        >
          {TABS.map((tab) => {
            const key = tab ?? "all";
            const selected = status === tab;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => {
                  setStatus(tab);
                  setPage(1);
                }}
                className={cn(
                  "h-9 rounded-lg px-4 font-medium transition-colors max-sm:px-3",
                  selected ? "bg-primary-soft text-primary" : "text-text hover:bg-page",
                )}
              >
                {TAB_LABELS[key]}
                {data && (
                  <small
                    className={cn(
                      "ml-1.5 font-medium",
                      selected ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {data.counts[key]}
                  </small>
                )}
              </button>
            );
          })}
        </div>
        <div className="relative max-w-90 min-w-65 flex-1">
          <label htmlFor="listings-search" className="sr-only">
            Search listings
          </label>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-muted-foreground"
          />
          <input
            id="listings-search"
            type="search"
            value={search}
            maxLength={80}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search by title or company"
            className={cn(FIELD_CLASS, "h-12 pl-10.5 sm:text-base")}
          />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <FilterChip
          pressed={noApplications}
          onToggle={() => {
            setNoApplications((value) => !value);
            setPage(1);
          }}
        >
          No applications
        </FilterChip>
        <FilterChip
          pressed={preparing}
          onToggle={() => {
            setPreparing((value) => !value);
            setPage(1);
          }}
        >
          Preparing
        </FilterChip>
      </div>

      {isPending ? (
        <div role="status" aria-label="Loading listings">
          <div className="h-72 animate-pulse rounded-xl border border-line bg-white" />
        </div>
      ) : error ? (
        <p role="alert" className="rounded-md bg-error-soft px-4 py-3 text-error">
          {error.message}
        </p>
      ) : (
        <Card className="gap-0 py-0">
          {data.items.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <h3 className="mb-2 font-display text-lg font-semibold text-ink">
                No listings match your search
              </h3>
              <p className="mb-4">Try another status, title or company.</p>
              <Button type="button" variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          ) : (
            <>
              <DataTable label="Listings">
                <thead>
                  <tr>
                    <Th>Listing</Th>
                    <Th className="max-sm:hidden">Recruiter</Th>
                    <Th>Status</Th>
                    <Th className="text-right">Applications</Th>
                    <Th className="max-sm:hidden">Created</Th>
                    <Th>
                      <span className="sr-only">Actions</span>
                    </Th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((listing) => (
                    <ClickableRow key={listing.id} onActivate={() => setSelectedId(listing.id)}>
                      <Td className="h-18">
                        <span className="block font-semibold break-words text-ink">
                          {listing.title}
                        </span>
                        <small className="block text-chip break-words text-muted-foreground">
                          {listing.companyName}
                        </small>
                      </Td>
                      <Td className="h-18 max-sm:hidden">{listing.recruiterName}</Td>
                      <Td className="h-18">
                        <ListingStatusPill status={listing.status} />
                        {(listing.hidden || !listing.matchReady) && (
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {listing.hidden && <Tag>Hidden, recruiter not active</Tag>}
                            {!listing.matchReady && <Tag>Preparing</Tag>}
                          </div>
                        )}
                      </Td>
                      <Td className="h-18 text-right tabular-nums">{listing.applicationCount}</Td>
                      <Td className="h-18 whitespace-nowrap max-sm:hidden">
                        {formatDate(listing.createdAt)}
                      </Td>
                      <Td className="h-18">
                        <div className="flex justify-end">
                          {listing.status === "removed" ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={restore.isPending && restore.variables === listing.id}
                              onClick={() => handleRestore(listing)}
                            >
                              Restore
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => setRemovingId(listing.id)}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      </Td>
                    </ClickableRow>
                  ))}
                </tbody>
              </DataTable>
              <TablePager
                page={data.page}
                pageSize={data.pageSize}
                total={data.total}
                onPageChange={setPage}
              />
            </>
          )}
        </Card>
      )}

      <RemoveListingDialog listingId={removingId} onClose={() => setRemovingId(null)} />
      <ListingDrawer listingId={selectedId} onClose={() => setSelectedId(null)} />
    </>
  );
}
