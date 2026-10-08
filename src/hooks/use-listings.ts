"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import type { ListingResponse } from "@/validators/listing.validator";

export const listingKeys = {
  all: ["listings"] as const,
  list: ["listings", "list"] as const,
  detail: (id: string) => ["listings", "detail", id] as const,
};

export function useListings() {
  return useQuery({
    queryKey: listingKeys.list,
    queryFn: () => api.get<ListingResponse[]>("/api/listings"),
  });
}
