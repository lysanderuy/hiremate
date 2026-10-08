"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import type { SkillResponse, SuggestSkillsInput } from "@/validators/skill.validator";

import { skillKeys } from "./use-skills";

export function useSuggestSkills(input: SuggestSkillsInput, enabled: boolean) {
  return useQuery({
    queryKey: skillKeys.suggest(input.title, input.description),
    queryFn: () => api.post<SkillResponse[]>("/api/skills/suggest", input),
    enabled,
    staleTime: 5 * 60_000,
  });
}
