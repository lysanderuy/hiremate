import { Suspense } from "react";

import { JobsView } from "@/components/jobs/jobs-view";
import { PageHeader } from "@/components/shared/page-header";
import { requireRole } from "@/lib/auth/require-role";

export default async function ApplicantJobsPage() {
  await requireRole("applicant");

  return (
    <div>
      <PageHeader
        title="Browse jobs"
        description="Find open listings and see how well you fit before you apply."
      />
      <Suspense fallback={null}>
        <JobsView />
      </Suspense>
    </div>
  );
}
