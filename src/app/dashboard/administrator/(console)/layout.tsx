import type { ReactNode } from "react";

import {
  AdministratorSidebar,
  AdministratorTopBar,
} from "@/components/shared/administrator-sidebar";
import { Toaster } from "@/components/shared/toaster";
import { requireRole } from "@/lib/auth/require-role";

export default async function AdministratorConsoleLayout({ children }: { children: ReactNode }) {
  await requireRole("administrator");

  return (
    <div className="flex min-h-screen bg-page">
      <AdministratorSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdministratorTopBar />
        <main className="mx-auto w-full max-w-310 flex-1 px-4 pt-5 pb-12 min-[961px]:p-8 min-[961px]:pb-12">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  );
}
