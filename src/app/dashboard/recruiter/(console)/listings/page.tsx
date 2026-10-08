import { Briefcase } from "lucide-react";

import { PagePlaceholder } from "@/components/shared/page-placeholder";
import { requireActiveRecruiter } from "@/lib/auth/require-role";

export default async function RecruiterListingsPage() {
  await requireActiveRecruiter();

  return (
    <PagePlaceholder
      icon={Briefcase}
      title="Listings"
      description="Your listings will appear here."
    />
  );
}
