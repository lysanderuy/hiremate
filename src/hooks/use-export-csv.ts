"use client";

import { useMutation } from "@tanstack/react-query";

import { api } from "@/lib/api/client";

export function useExportCsv(basePath: string) {
  return useMutation({
    mutationFn: async (kind: string) => {
      const { blob, fileName } = await api.download(`${basePath}/${kind}`);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    },
  });
}
