import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { profileService } from "@/services/profile.service";
import type { AppRole } from "@/types/roles";

export async function getSessionProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await profileService.getById(user.id);
  if (!profile) redirect("/login");

  return { user, profile };
}

export async function requireRole(role: AppRole) {
  const session = await getSessionProfile();

  if (session.profile.role !== role) redirect("/dashboard");

  return session;
}

export async function requireActiveRecruiter() {
  const session = await requireRole("recruiter");

  if (session.profile.accountStatus !== "active") redirect("/dashboard/recruiter/status");

  return session;
}
