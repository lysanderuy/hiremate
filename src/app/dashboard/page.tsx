import { redirect } from "next/navigation";

import { getSessionProfile } from "@/lib/auth/require-role";

export default async function DashboardPage() {
  const { profile } = await getSessionProfile();

  redirect(`/dashboard/${profile.role}`);
}
