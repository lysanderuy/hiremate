import { Users } from "lucide-react";

import { PagePlaceholder } from "@/components/shared/page-placeholder";
import { requireActiveRecruiter } from "@/lib/auth/require-role";

export default async function RecruiterCandidatesPage() {
  await requireActiveRecruiter();

  return (
    <PagePlaceholder
      icon={Users}
      title="Candidates"
      description="Ranked applicants for your listings will appear here."
    />
  );
}
