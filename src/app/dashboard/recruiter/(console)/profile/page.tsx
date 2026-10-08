import { User } from "lucide-react";

import { PagePlaceholder } from "@/components/shared/page-placeholder";
import { requireActiveRecruiter } from "@/lib/auth/require-role";

export default async function RecruiterProfilePage() {
  await requireActiveRecruiter();

  return (
    <PagePlaceholder
      icon={User}
      title="Profile"
      description="You will be able to edit your display name here."
    />
  );
}
