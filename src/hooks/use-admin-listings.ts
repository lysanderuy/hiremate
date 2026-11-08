"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import type {
  AdminListingListResponse,
  ListAdminListingsQuery,
} from "@/validators/admin-listing.validator";

export type AdminListingFilters = Partial<ListAdminListingsQuery>;

export const adminListingKeys = {
  all: ["admin-listings"] as const,
  list: (filters: AdminListingFilters) => ["admin-listings", "list", filters] as const,
  detail: (id: string) => ["admin-listings", "detail", id] as const,
};

export function useAdminListings(filters: AdminListingFilters = {}) {
  return useQuery({
    queryKey: adminListingKeys.list(filters),
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.q) params.set("q", filters.q);
      if (filters.status) params.set("status", filters.status);
      if (filters.noApplications) params.set("noApplications", "true");
      if (filters.preparing) params.set("preparing", "true");
      if (filters.page) params.set("page", String(filters.page));
      const qs = params.toString();
      return api.get<AdminListingListResponse>(`/api/admin/listings${qs ? `?${qs}` : ""}`);
    },
    placeholderData: keepPreviousData,
  });
}
