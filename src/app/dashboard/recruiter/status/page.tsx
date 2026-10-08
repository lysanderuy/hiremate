import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/shared/logout-button";
import { requireRole } from "@/lib/auth/require-role";

export default async function RecruiterStatusPage() {
  const { profile } = await requireRole("recruiter");

  if (profile.accountStatus === "active") redirect("/dashboard/recruiter");

  const copy = {
    pending: {
      title: "Awaiting approval.",
      body: "An administrator is reviewing your account. You can post listings once it is approved.",
    },
    rejected: {
      title: "Your account was not approved.",
      body: profile.rejectionReason ?? "No reason was given.",
    },
    suspended: {
      title: "This account is suspended.",
      body: "You cannot post listings or review applicants while it is suspended.",
    },
  }[profile.accountStatus];

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-section p-6 text-center">
      <div className="max-w-md">
        <h1 className="text-2xl font-semibold text-navy">{copy.title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{copy.body}</p>
      </div>
      <LogoutButton />
    </main>
  );
}
