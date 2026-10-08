import { RecruiterDashboard } from "@/components/dashboard/recruiter-dashboard";
import { requireActiveRecruiter } from "@/lib/auth/require-role";

export default async function RecruiterDashboardPage() {
  const { profile } = await requireActiveRecruiter();

  return <RecruiterDashboard name={profile.displayName ?? "there"} />;
}
