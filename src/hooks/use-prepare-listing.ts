"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import type { ListingResponse } from "@/validators/listing.validator";

import { listingKeys } from "./use-listings";

export function usePrepareListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.post<ListingResponse>(`/api/listings/${id}/prepare`, {}),
    onSuccess: (listing) => {
      queryClient.setQueryData(listingKeys.detail(listing.id), listing);
      return queryClient.invalidateQueries({ queryKey: listingKeys.list });
    },
  });
}
