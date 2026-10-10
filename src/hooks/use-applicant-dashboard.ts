"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import type { ApplicantDashboardResponse } from "@/validators/dashboard.validator";

export const applicantDashboardKeys = {
  all: ["applicant-dashboard"] as const,
};

export function useApplicantDashboard() {
  return useQuery({
    queryKey: applicantDashboardKeys.all,
    queryFn: () => api.get<ApplicantDashboardResponse>("/api/dashboard/applicant"),
  });
}
