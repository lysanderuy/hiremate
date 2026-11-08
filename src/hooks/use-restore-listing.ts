"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import type { AdminListingResultResponse } from "@/validators/admin-listing.validator";

import { adminDashboardKeys } from "./use-admin-dashboard";
import { adminListingKeys } from "./use-admin-listings";

export function useRestoreListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api.post<AdminListingResultResponse>(`/api/admin/listings/${id}/restore`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminDashboardKeys.all });
      queryClient.invalidateQueries({ queryKey: adminListingKeys.all });
    },
  });
}
