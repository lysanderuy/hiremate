import { Settings } from "lucide-react";

import { PagePlaceholder } from "@/components/shared/page-placeholder";
import { requireActiveRecruiter } from "@/lib/auth/require-role";

export default async function RecruiterSettingsPage() {
  await requireActiveRecruiter();

  return (
    <PagePlaceholder
      icon={Settings}
      title="Settings"
      description="You will be able to edit your company name here."
    />
  );
}
