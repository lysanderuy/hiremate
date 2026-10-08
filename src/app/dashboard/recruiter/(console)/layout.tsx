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
        <main className="mx-auto w-full max-w-7xl flex-1 p-5 sm:p-7.5 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
