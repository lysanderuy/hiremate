import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { ExportMenu } from "@/components/admin/export-menu";
import { PageHeader } from "@/components/shared/page-header";
import { requireRole } from "@/lib/auth/require-role";

export default async function AdministratorDashboardPage() {
  await requireRole("administrator");

  return (
    <div>
      <PageHeader title="Dashboard" description="Platform overview." action={<ExportMenu />} />
      <AdminDashboard />
    </div>
  );
}
