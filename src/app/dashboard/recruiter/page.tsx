import { LogoutButton } from "@/components/shared/logout-button";
import { requireRole } from "@/lib/auth/require-role";

export default async function RecruiterDashboardPage() {
  await requireRole("recruiter");

  return (
    <main className="mx-auto w-full max-w-2xl p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Recruiter dashboard</h1>
        <LogoutButton />
      </div>
    </main>
  );
}
