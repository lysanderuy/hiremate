"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import type { PendingRecruiterResponse } from "@/validators/approval.validator";

export const approvalKeys = {
  all: ["approvals"] as const,
  list: ["approvals", "list"] as const,
};

export function useApprovals() {
  return useQuery({
    queryKey: approvalKeys.list,
    queryFn: () => api.get<PendingRecruiterResponse[]>("/api/admin/approvals"),
  });
}
