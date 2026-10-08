import Link from "next/link";

import { ListingsTable } from "@/components/listings/listings-table";
import { buttonVariants } from "@/components/ui/button";
import { requireActiveRecruiter } from "@/lib/auth/require-role";
import { cn } from "@/lib/utils";

export default async function RecruiterListingsPage() {
  await requireActiveRecruiter();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-navy">Listings</h1>
          <p className="text-sm text-muted-foreground">Post and manage your listings.</p>
        </div>
        <Link
          href="/dashboard/recruiter/listings/new"
          className={cn(buttonVariants({ size: "lg" }), "h-10 px-4")}
        >
          + Create Job Listing
        </Link>
      </div>
      <ListingsTable />
    </div>
  );
}
