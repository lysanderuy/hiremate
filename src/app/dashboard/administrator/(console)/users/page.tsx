import { UsersView } from "@/components/admin/users-view";
import { PageHeader } from "@/components/shared/page-header";
import { requireRole } from "@/lib/auth/require-role";

export default async function AdministratorUsersPage() {
  await requireRole("administrator");

  return (
    <div>
      <PageHeader title="Users" description="Search, suspend and reactivate accounts." />
      <UsersView />
    </div>
  );
}
