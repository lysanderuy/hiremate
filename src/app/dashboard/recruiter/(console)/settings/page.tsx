import { CompanyForm } from "@/components/shared/company-form";
import { requireActiveRecruiter } from "@/lib/auth/require-role";

export default async function RecruiterSettingsPage() {
  await requireActiveRecruiter();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-navy">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Your company name appears on every listing you post.
        </p>
      </div>
      <div className="rounded-xl border border-border bg-white p-4 sm:p-6">
        <div className="max-w-xl">
          <CompanyForm />
        </div>
      </div>
    </div>
  );
}
