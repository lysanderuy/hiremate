"use client";

import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import type { ResumeResponse } from "@/validators/resume.validator";

import { applicantDashboardKeys } from "./use-applicant-dashboard";
import { myApplicationKeys } from "./use-my-applications";
import { openListingKeys } from "./use-open-listings";

export const resumeKeys = {
  all: ["resume"] as const,
  me: ["resume", "me"] as const,
};

export async function syncAfterResumeChange(queryClient: QueryClient, data: ResumeResponse) {
  queryClient.setQueryData(resumeKeys.me, data);
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: openListingKeys.all }),
    queryClient.invalidateQueries({ queryKey: myApplicationKeys.all }),
    queryClient.invalidateQueries({ queryKey: applicantDashboardKeys.all }),
  ]);
}

export function useResume() {
  return useQuery({
    queryKey: resumeKeys.me,
    queryFn: () => api.get<ResumeResponse | null>("/api/resumes/me"),
  });
}

export function useReprocessResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.post<ResumeResponse>("/api/resumes/me/reprocess", {}),
    onSuccess: (data) => syncAfterResumeChange(queryClient, data),
  });
}
