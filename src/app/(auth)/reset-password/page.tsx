import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { RECOVERY_COOKIE } from "@/lib/auth/recovery";
import { createClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "./reset-password-form";

// Arrives from the recovery email link with a session and recovery cookie set by
// /api/auth/callback. Re-checked since direct navigation can bypass the proxy.
export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const hasRecoveryCookie = (await cookies()).has(RECOVERY_COOKIE);
  if (!hasRecoveryCookie) redirect("/forgot-password");

  return <ResetPasswordForm />;
}
