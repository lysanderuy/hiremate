import { AccountProfile } from "@/components/profile/account-profile";
import { PageHeader } from "@/components/shared/page-header";
import { requireRole } from "@/lib/auth/require-role";

export default async function AdministratorProfilePage() {
  await requireRole("administrator");

  return (
    <div>
      <PageHeader title="Profile" description="Your account details." />
      <AccountProfile roleLabel="Administrator" />
    </div>
  );
}
