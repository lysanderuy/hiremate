"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import type { CompanyResponse } from "@/validators/company.validator";

export const companyKeys = {
  me: ["company", "me"] as const,
};

export function useCompany() {
  return useQuery({
    queryKey: companyKeys.me,
    queryFn: () => api.get<CompanyResponse | null>("/api/company"),
  });
}
