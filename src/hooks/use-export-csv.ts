"use client";

import { useMutation } from "@tanstack/react-query";

import { api } from "@/lib/api/client";

export function useExportCsv() {
  return useMutation({
    mutationFn: async (kind: string) => {
      const { blob, fileName } = await api.download(`/api/admin/export/${kind}`);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    },
  });
}
