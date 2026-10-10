"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import type { MyApplicationDetailResponse } from "@/validators/application.validator";

import { applicantDashboardKeys } from "./use-applicant-dashboard";
import { myApplicationKeys } from "./use-my-applications";
import { openListingKeys } from "./use-open-listings";

export function useWithdrawApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api.post<MyApplicationDetailResponse>(`/api/applications/me/${id}/withdraw`, {}),
    onSuccess: async (data, id) => {
      queryClient.setQueryData(myApplicationKeys.detail(id), data);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: myApplicationKeys.all }),
        queryClient.invalidateQueries({ queryKey: openListingKeys.all }),
        queryClient.invalidateQueries({ queryKey: applicantDashboardKeys.all }),
      ]);
    },
    onError: async (_error, id) => {
      await queryClient.invalidateQueries({ queryKey: myApplicationKeys.detail(id) });
    },
  });
}
