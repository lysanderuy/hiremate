import type { ReactNode } from "react";

import { ApplicantSidebar, ApplicantTopBar } from "@/components/shared/applicant-sidebar";
import { requireRole } from "@/lib/auth/require-role";

export default async function ApplicantConsoleLayout({ children }: { children: ReactNode }) {
  await requireRole("applicant");

  return (
    <div className="flex min-h-screen bg-page">
      <ApplicantSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <ApplicantTopBar />
        <main className="mx-auto w-full max-w-310 flex-1 px-4 pt-5 pb-12 min-[961px]:p-8 min-[961px]:pb-12">
          {children}
        </main>
      </div>
    </div>
  );
}
