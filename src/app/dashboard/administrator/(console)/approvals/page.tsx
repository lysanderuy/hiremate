import { ApprovalsView } from "@/components/admin/approvals-view";
import { PageHeader } from "@/components/shared/page-header";
import { requireRole } from "@/lib/auth/require-role";

export default async function AdministratorApprovalsPage() {
  await requireRole("administrator");

  return (
    <div>
      <PageHeader
        title="Approvals"
        description="Review recruiter accounts waiting for approval. Oldest first."
      />
      <ApprovalsView />
    </div>
  );
}
