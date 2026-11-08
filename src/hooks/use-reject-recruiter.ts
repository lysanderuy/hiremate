"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import type { ApprovalResultResponse, RejectRecruiterInput } from "@/validators/approval.validator";

import { invalidateAdmin } from "./invalidate-admin";

export function useRejectRecruiter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string } & RejectRecruiterInput) =>
      api.post<ApprovalResultResponse>(`/api/admin/approvals/${id}/reject`, { reason }),
    onSuccess: () => {
      invalidateAdmin(queryClient);
    },
  });
}
