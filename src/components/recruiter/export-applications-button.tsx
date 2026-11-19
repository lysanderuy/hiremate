"use client";

import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useExportCsv } from "@/hooks/use-export-csv";
import { useToastStore } from "@/stores/toast.store";

export function ExportApplicationsButton() {
  const exportCsv = useExportCsv("/api/recruiter/export");
  const showToast = useToastStore((state) => state.show);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={exportCsv.isPending}
      onClick={() =>
        exportCsv.mutate("applications", {
          onSuccess: () => showToast("Exported applications as CSV"),
          onError: (error) => showToast(error.message),
        })
      }
    >
      <Download aria-hidden="true" />
      {exportCsv.isPending ? "Exporting..." : "Export applications"}
    </Button>
  );
}
