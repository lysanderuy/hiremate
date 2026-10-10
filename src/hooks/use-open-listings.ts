"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import type {
  ListOpenListingsQuery,
  OpenListingListResponse,
} from "@/validators/open-listing.validator";

export type OpenListingFilters = Partial<ListOpenListingsQuery>;

export const openListingKeys = {
  all: ["open-listings"] as const,
  list: (filters: OpenListingFilters) => ["open-listings", "list", filters] as const,
  detail: (id: string) => ["open-listings", "detail", id] as const,
};

export function useOpenListings(filters: OpenListingFilters = {}) {
  return useQuery({
    queryKey: openListingKeys.list(filters),
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.q) params.set("q", filters.q);
      if (filters.location) params.set("location", filters.location);
      if (filters.type) params.set("type", filters.type);
      if (filters.minPay !== undefined) params.set("minPay", String(filters.minPay));
      if (filters.sort) params.set("sort", filters.sort);
      if (filters.page) params.set("page", String(filters.page));
      const qs = params.toString();
      return api.get<OpenListingListResponse>(`/api/listings/open${qs ? `?${qs}` : ""}`);
    },
    placeholderData: keepPreviousData,
  });
}
