"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import type {
  ApplyToListingInput,
  MyApplicationDetailResponse,
} from "@/validators/application.validator";

import { applicantDashboardKeys } from "./use-applicant-dashboard";
import { myApplicationKeys } from "./use-my-applications";
import { openListingKeys } from "./use-open-listings";

export function useApply() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ApplyToListingInput) =>
      api.post<MyApplicationDetailResponse>("/api/applications", input),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: openListingKeys.all }),
        queryClient.invalidateQueries({ queryKey: myApplicationKeys.all }),
        queryClient.invalidateQueries({ queryKey: applicantDashboardKeys.all }),
      ]);
    },
  });
}
