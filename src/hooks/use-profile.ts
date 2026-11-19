"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import type { ProfileResponse, UpdateProfileInput } from "@/validators/profile.validator";

// Example server-state hooks — replace/extend per project.

export const profileKeys = {
  me: ["profile", "me"] as const,
};

export function useProfile() {
  return useQuery({
    queryKey: profileKeys.me,
    queryFn: () => api.get<ProfileResponse>("/api/profile"),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateProfileInput) => api.patch<ProfileResponse>("/api/profile", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.me });
    },
  });
}
