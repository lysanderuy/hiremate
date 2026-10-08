"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import type {
  ApplicationDetailResponse,
  UpdateApplicationStatusInput,
} from "@/validators/application.validator";

import { applicationKeys } from "./use-applications";
import { dashboardKeys } from "./use-dashboard";
import { listingKeys } from "./use-listings";

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string } & UpdateApplicationStatusInput) =>
      api.patch<ApplicationDetailResponse>(`/api/applications/${id}`, { status }),
    onSuccess: async (data, { id }) => {
      queryClient.setQueryData(applicationKeys.detail(id), data);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: applicationKeys.lists }),
        queryClient.invalidateQueries({ queryKey: listingKeys.all }),
        queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
      ]);
    },
    onError: async (_error, { id }) => {
      await queryClient.invalidateQueries({ queryKey: applicationKeys.detail(id) });
    },
  });
}
