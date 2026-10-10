"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import type { ResumeResponse } from "@/validators/resume.validator";

import { syncAfterResumeChange } from "./use-resume";

export function useUploadResumePdf() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => {
      const body = new FormData();
      body.append("file", file);
      return api.upload<ResumeResponse>("/api/resumes/me/pdf", body);
    },
    onSuccess: (data) => syncAfterResumeChange(queryClient, data),
  });
}
