"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import type { OpenListingDetailResponse } from "@/validators/open-listing.validator";

import { openListingKeys } from "./use-open-listings";

export function useOpenListing(id: string) {
  return useQuery({
    queryKey: openListingKeys.detail(id),
    queryFn: () => api.get<OpenListingDetailResponse>(`/api/listings/open/${id}`),
    enabled: Boolean(id),
  });
}
