import { ApplicantDashboard } from "@/components/dashboard/applicant-dashboard";
import { requireRole } from "@/lib/auth/require-role";

export default async function ApplicantDashboardPage() {
  await requireRole("applicant");

  return <ApplicantDashboard />;
}
