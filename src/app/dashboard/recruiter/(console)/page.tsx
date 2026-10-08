import { LayoutDashboard } from "lucide-react";

import { PagePlaceholder } from "@/components/shared/page-placeholder";
import { requireActiveRecruiter } from "@/lib/auth/require-role";

export default async function RecruiterDashboardPage() {
  await requireActiveRecruiter();

  return (
    <PagePlaceholder
      icon={LayoutDashboard}
      title="Dashboard"
      description="Your listings and applicants will be summarised here."
    />
  );
}
