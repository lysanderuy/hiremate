import "server-only";

import type { User } from "@supabase/supabase-js";
import type { NextResponse } from "next/server";

import type { Profile } from "@/db/schema";
import { apiError } from "@/lib/api/response";
import { createClient } from "@/lib/supabase/server";
import { profileService } from "@/services/profile.service";
import type { AppRole } from "@/types/roles";

type ActiveAuth =
  { ok: true; user: User; profile: Profile } | { ok: false; response: NextResponse };

async function authenticateActive(role: AppRole): Promise<ActiveAuth> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, response: apiError("Unauthorized", 401) };

  const profile = await profileService.getById(user.id);
  if (!profile || profile.role !== role || profile.accountStatus !== "active") {
    return {
      ok: false,
      response: apiError("Your account is not approved for this action.", 403),
    };
  }

  return { ok: true, user, profile };
}

export function authenticateActiveRecruiter(): Promise<ActiveAuth> {
  return authenticateActive("recruiter");
}

export function authenticateApplicant(): Promise<ActiveAuth> {
  return authenticateActive("applicant");
}
