"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";

import { listingKeys } from "./use-listings";

export function useDeleteListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete<{ id: string }>(`/api/listings/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: listingKeys.all }),
  });
}
