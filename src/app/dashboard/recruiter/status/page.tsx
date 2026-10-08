import { CircleAlert, Clock, Lock } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthHeader, AuthSplit, AuthStatusIcon } from "@/components/auth/auth-split";
import { LogoutButton } from "@/components/shared/logout-button";
import { buttonVariants } from "@/components/ui/button";
import { requireRole } from "@/lib/auth/require-role";
import { cn } from "@/lib/utils";

export default async function RecruiterStatusPage() {
  const { profile } = await requireRole("recruiter");

  if (profile.accountStatus === "active") redirect("/dashboard/recruiter");

  const copy = {
    pending: {
      icon: Clock,
      tone: "default",
      title: "Awaiting approval",
      body: "An administrator reviews every new recruiter account. You can browse jobs while you wait, and post listings once you are approved.",
    },
    rejected: {
      icon: CircleAlert,
      tone: "warn",
      title: "Your account was not approved",
      body: "You can still browse jobs.",
    },
    suspended: {
      icon: Lock,
      tone: "warn",
      title: "This account is suspended",
      body: "You cannot post listings or review applicants while it is suspended.",
    },
  } as const;
  const { icon, tone, title, body } = copy[profile.accountStatus];

  return (
    <AuthSplit role="recruiter">
      <AuthStatusIcon icon={icon} tone={tone} />
      <AuthHeader title={title}>{body}</AuthHeader>

      {profile.accountStatus === "rejected" && (
        <div className="mb-5 rounded-md border border-line bg-page p-4">
          <p className="mb-1 text-chip text-muted-foreground">Reason from the administrator</p>
          <p className="text-sm text-ink">{profile.rejectionReason ?? "No reason was given."}</p>
        </div>
      )}

      <div className="grid gap-3">
        {profile.accountStatus === "pending" && (
          <Link href="/jobs" className={cn(buttonVariants({ size: "lg" }), "w-full text-sm")}>
            Browse jobs
          </Link>
        )}
        <LogoutButton
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "w-full text-sm")}
        >
          Log out
        </LogoutButton>
      </div>
    </AuthSplit>
  );
}
