"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import type {
  AdminListingResultResponse,
  RemoveListingInput,
} from "@/validators/admin-listing.validator";

import { adminDashboardKeys } from "./use-admin-dashboard";
import { adminListingKeys } from "./use-admin-listings";

export function useRemoveListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string } & RemoveListingInput) =>
      api.post<AdminListingResultResponse>(`/api/admin/listings/${id}/remove`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminDashboardKeys.all });
      queryClient.invalidateQueries({ queryKey: adminListingKeys.all });
    },
  });
}
