"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import type { ListingResponse, UpdateListingInput } from "@/validators/listing.validator";

import { listingKeys } from "./use-listings";

export function useUpdateListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateListingInput }) =>
      api.patch<ListingResponse>(`/api/listings/${id}`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listingKeys.all }),
  });
}
