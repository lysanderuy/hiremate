"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import type {
  ListMyApplicationsQuery,
  MyApplicationListResponse,
} from "@/validators/application.validator";

export type MyApplicationFilters = ListMyApplicationsQuery;

export const myApplicationKeys = {
  all: ["my-applications"] as const,
  list: (filters: MyApplicationFilters) => ["my-applications", "list", filters] as const,
  detail: (id: string) => ["my-applications", "detail", id] as const,
};

export function useMyApplications(filters: MyApplicationFilters = {}) {
  return useQuery({
    queryKey: myApplicationKeys.list(filters),
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.status) params.set("status", filters.status);
      const qs = params.toString();
      return api.get<MyApplicationListResponse>(`/api/applications/me${qs ? `?${qs}` : ""}`);
    },
  });
}
