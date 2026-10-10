"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import type { MyApplicationDetailResponse } from "@/validators/application.validator";

import { myApplicationKeys } from "./use-my-applications";

export function useMyApplication(id: string) {
  return useQuery({
    queryKey: myApplicationKeys.detail(id),
    queryFn: () => api.get<MyApplicationDetailResponse>(`/api/applications/me/${id}`),
    enabled: Boolean(id),
  });
}
