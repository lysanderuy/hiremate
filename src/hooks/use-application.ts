"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import type { ApplicationDetailResponse } from "@/validators/application.validator";

import { applicationKeys } from "./use-applications";

export function useApplication(id: string) {
  return useQuery({
    queryKey: applicationKeys.detail(id),
    queryFn: () => api.get<ApplicationDetailResponse>(`/api/applications/${id}`),
  });
}
