"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import type { CreateListingInput, ListingResponse } from "@/validators/listing.validator";

import { dashboardKeys } from "./use-dashboard";
import { listingKeys } from "./use-listings";

export function useCreateListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateListingInput) => api.post<ListingResponse>("/api/listings", input),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: listingKeys.all }),
        queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
      ]),
  });
}
