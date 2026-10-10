import Link from "next/link";
import { Suspense } from "react";

import { ApplicationsTable } from "@/components/my-applications/applications-table";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/require-role";

export default async function ApplicantApplicationsPage() {
  await requireRole("applicant");

  return (
    <div>
      <PageHeader
        title="My applications"
        description="Track the status of every application you sent."
        action={
          <Link
            href="/dashboard/applicant/jobs"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Browse jobs
          </Link>
        }
      />
      <Suspense fallback={null}>
        <ApplicationsTable />
      </Suspense>
    </div>
  );
}
