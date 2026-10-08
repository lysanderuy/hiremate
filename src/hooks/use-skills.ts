"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import type { SkillResponse } from "@/validators/skill.validator";

export const skillKeys = {
  search: (q: string) => ["skills", "search", q] as const,
  suggest: (title: string, description: string) =>
    ["skills", "suggest", title, description] as const,
};

export function useSkills(q: string) {
  return useQuery({
    queryKey: skillKeys.search(q),
    queryFn: () => api.get<SkillResponse[]>(`/api/skills?q=${encodeURIComponent(q)}&limit=20`),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}
