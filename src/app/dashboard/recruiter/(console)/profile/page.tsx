import { ProfileForm } from "@/components/shared/profile-form";
import { requireActiveRecruiter } from "@/lib/auth/require-role";

export default async function RecruiterProfilePage() {
  await requireActiveRecruiter();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-navy">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Update your account name and the company shown on your listings.
        </p>
      </div>
      <div className="rounded-xl border border-border bg-white p-4 sm:p-6">
        <ProfileForm />
      </div>
    </div>
  );
}
