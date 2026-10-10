import { Suspense } from "react";

import { ResumeEditor } from "@/components/resume/resume-editor";
import { PageHeader } from "@/components/shared/page-header";
import { requireRole } from "@/lib/auth/require-role";

export default async function ApplicantResumePage() {
  await requireRole("applicant");

  return (
    <div>
      <PageHeader
        title="My resume"
        description="You have one resume at a time. Saving a new one replaces the current one."
      />
      <Suspense fallback={<p className="text-muted-foreground">Loading...</p>}>
        <ResumeEditor />
      </Suspense>
    </div>
  );
}
