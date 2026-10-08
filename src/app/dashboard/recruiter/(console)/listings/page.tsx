import { Plus } from "lucide-react";
import Link from "next/link";

import { ListingsTable } from "@/components/listings/listings-table";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { requireActiveRecruiter } from "@/lib/auth/require-role";

export default async function RecruiterListingsPage() {
  await requireActiveRecruiter();

  return (
    <div>
      <PageHeader
        title="Listings"
        description="Create and manage your listings."
        action={
          <Link href="/dashboard/recruiter/listings/new" className={buttonVariants({ size: "sm" })}>
            <Plus aria-hidden="true" />
            Create job listing
          </Link>
        }
      />
      <ListingsTable />
    </div>
  );
}
