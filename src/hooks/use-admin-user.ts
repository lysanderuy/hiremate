"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import type { AdminUserDetailResponse } from "@/validators/admin-user.validator";

import { adminUserKeys } from "./use-admin-users";

export function useAdminUser(id: string | null) {
  return useQuery({
    queryKey: adminUserKeys.detail(id ?? ""),
    queryFn: () => api.get<AdminUserDetailResponse>(`/api/admin/users/${id}`),
    enabled: id !== null,
  });
}
