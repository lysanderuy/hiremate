"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import type { ListingResponse } from "@/validators/listing.validator";

import { listingKeys } from "./use-listings";

export function useListing(id: string) {
  return useQuery({
    queryKey: listingKeys.detail(id),
    queryFn: () => api.get<ListingResponse>(`/api/listings/${id}`),
  });
}
