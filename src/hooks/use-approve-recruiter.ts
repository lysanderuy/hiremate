"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import type { ApprovalResultResponse } from "@/validators/approval.validator";

import { invalidateAdmin } from "./invalidate-admin";

export function useApproveRecruiter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api.post<ApprovalResultResponse>(`/api/admin/approvals/${id}/approve`, {}),
    onSuccess: () => {
      invalidateAdmin(queryClient);
    },
  });
}
