"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import type { CompanyResponse, UpdateCompanyInput } from "@/validators/company.validator";

import { companyKeys } from "./use-company";

export function useUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateCompanyInput) => api.patch<CompanyResponse>("/api/company", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: companyKeys.me }),
  });
}
