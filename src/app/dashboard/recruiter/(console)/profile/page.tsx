import { PageHeader } from "@/components/shared/page-header";
import { ProfileForm } from "@/components/shared/profile-form";
import { requireActiveRecruiter } from "@/lib/auth/require-role";

export default async function RecruiterProfilePage() {
  await requireActiveRecruiter();

  return (
    <div>
      <PageHeader
        title="Profile"
        description="Update your name and the company shown on your listings."
      />
      <div className="max-w-190 rounded-xl border border-line bg-white p-5 shadow-sm sm:p-8">
        <ProfileForm />
      </div>
    </div>
  );
}
