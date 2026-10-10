import { ApplicantProfile } from "@/components/profile/applicant-profile";
import { PageHeader } from "@/components/shared/page-header";
import { requireRole } from "@/lib/auth/require-role";

export default async function ApplicantProfilePage() {
  await requireRole("applicant");

  return (
    <div>
      <PageHeader title="Profile" description="Your account details." />
      <ApplicantProfile />
    </div>
  );
}
