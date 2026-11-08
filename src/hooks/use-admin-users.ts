"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import type { AdminUserListResponse, ListAdminUsersQuery } from "@/validators/admin-user.validator";

export type AdminUserFilters = Partial<ListAdminUsersQuery>;

export const adminUserKeys = {
  all: ["admin-users"] as const,
  list: (filters: AdminUserFilters) => ["admin-users", "list", filters] as const,
  detail: (id: string) => ["admin-users", "detail", id] as const,
};

export function useAdminUsers(filters: AdminUserFilters = {}) {
  return useQuery({
    queryKey: adminUserKeys.list(filters),
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.q) params.set("q", filters.q);
      if (filters.role) params.set("role", filters.role);
      if (filters.status) params.set("status", filters.status);
      if (filters.page) params.set("page", String(filters.page));
      const qs = params.toString();
      return api.get<AdminUserListResponse>(`/api/admin/users${qs ? `?${qs}` : ""}`);
    },
    placeholderData: keepPreviousData,
  });
}
