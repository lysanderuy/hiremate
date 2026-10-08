import type { ReactNode } from "react";

import { RecruiterSidebar, RecruiterTopBar } from "@/components/shared/recruiter-sidebar";
import { requireActiveRecruiter } from "@/lib/auth/require-role";

export default async function RecruiterConsoleLayout({ children }: { children: ReactNode }) {
  await requireActiveRecruiter();

  return (
    <div className="flex min-h-screen bg-page">
      <RecruiterSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <RecruiterTopBar />
        <main className="mx-auto w-full max-w-310 flex-1 px-4 pt-5 pb-12 min-[961px]:p-8 min-[961px]:pb-12">
          {children}
        </main>
      </div>
    </div>
  );
}
