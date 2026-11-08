"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import type { AdminUserResultResponse } from "@/validators/admin-user.validator";

import { invalidateAdmin } from "./invalidate-admin";

export function useReactivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      api.post<AdminUserResultResponse>(`/api/admin/users/${id}/reactivate`, {}),
    onSuccess: () => {
      invalidateAdmin(queryClient);
    },
  });
}
