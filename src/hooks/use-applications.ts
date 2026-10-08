"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import type { ApplicationStatus } from "@/types/applications";
import type { ApplicationListResponse, MatchBand } from "@/validators/application.validator";

export type ApplicationFilters = {
  status?: ApplicationStatus;
  search?: string;
  band?: MatchBand;
  sort?: "match" | "newest" | "name";
};

export const applicationKeys = {
  all: ["applications"] as const,
  lists: ["applications", "list"] as const,
  list: (listingId: string, filters: ApplicationFilters) =>
    ["applications", "list", listingId, filters] as const,
  detail: (id: string) => ["applications", "detail", id] as const,
};

export function useApplications(listingId: string, filters: ApplicationFilters = {}) {
  return useQuery({
    queryKey: applicationKeys.list(listingId, filters),
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.status) params.set("status", filters.status);
      if (filters.search) params.set("search", filters.search);
      if (filters.band) params.set("band", filters.band);
      if (filters.sort) params.set("sort", filters.sort);
      const qs = params.toString();
      return api.get<ApplicationListResponse>(
        `/api/listings/${listingId}/applications${qs ? `?${qs}` : ""}`,
      );
    },
    enabled: Boolean(listingId),
    placeholderData: (previous, previousQuery) =>
      previousQuery?.queryKey[2] === listingId ? previous : undefined,
  });
}
