import type { ReactNode } from "react";

import { RecruiterSidebar, RecruiterTopBar } from "@/components/shared/recruiter-sidebar";
import { requireActiveRecruiter } from "@/lib/auth/require-role";

export default async function RecruiterConsoleLayout({ children }: { children: ReactNode }) {
  await requireActiveRecruiter();

  return (
    <div className="flex min-h-screen bg-section">
      <RecruiterSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <RecruiterTopBar />
        <main className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
