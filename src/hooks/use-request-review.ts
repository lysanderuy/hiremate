"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import type { ApprovalResultResponse } from "@/validators/approval.validator";

import { profileKeys } from "./use-profile";

export function useRequestReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.post<ApprovalResultResponse>("/api/profile/review-request", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.me });
    },
  });
}
