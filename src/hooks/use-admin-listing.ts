"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import type { AdminListingDetailResponse } from "@/validators/admin-listing.validator";

import { adminListingKeys } from "./use-admin-listings";

export function useAdminListing(id: string | null) {
  return useQuery({
    queryKey: adminListingKeys.detail(id ?? ""),
    queryFn: () => api.get<AdminListingDetailResponse>(`/api/admin/listings/${id}`),
    enabled: id !== null,
  });
}
