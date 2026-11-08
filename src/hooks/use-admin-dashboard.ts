"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import type { AdminDashboardResponse } from "@/validators/admin-dashboard.validator";

export const adminDashboardKeys = {
  all: ["admin-dashboard"] as const,
};

export function useAdminDashboard() {
  return useQuery({
    queryKey: adminDashboardKeys.all,
    queryFn: () => api.get<AdminDashboardResponse>("/api/admin/dashboard"),
  });
}
