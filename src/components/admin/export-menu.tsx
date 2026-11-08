"use client";

import { Download } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useExportCsv } from "@/hooks/use-export-csv";
import { useToastStore } from "@/stores/toast.store";

const EXPORTS = [
  { kind: "users", label: "Users" },
  { kind: "listings", label: "Listings" },
  { kind: "applications", label: "Applications" },
] as const;

export function ExportMenu() {
  const showToast = useToastStore((state) => state.show);
  const exportCsv = useExportCsv();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={buttonVariants({ variant: "outline", size: "lg" })}>
        <Download aria-hidden="true" />
        Export CSV
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {EXPORTS.map(({ kind, label }) => (
          <DropdownMenuItem
            key={kind}
            disabled={exportCsv.isPending}
            onClick={() =>
              exportCsv.mutate(kind, {
                onSuccess: () => showToast(`Exported ${kind} as CSV`),
                onError: (error) => showToast(error.message),
              })
            }
          >
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
