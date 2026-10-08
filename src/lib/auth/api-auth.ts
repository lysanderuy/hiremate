import "server-only";

import type { User } from "@supabase/supabase-js";
import type { NextResponse } from "next/server";

import type { Profile } from "@/db/schema";
import { apiError } from "@/lib/api/response";
import { createClient } from "@/lib/supabase/server";
import { profileService } from "@/services/profile.service";

type ActiveRecruiterAuth =
  { ok: true; user: User; profile: Profile } | { ok: false; response: NextResponse };

export async function authenticateActiveRecruiter(): Promise<ActiveRecruiterAuth> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, response: apiError("Unauthorized", 401) };

  const profile = await profileService.getById(user.id);
  if (!profile || profile.role !== "recruiter" || profile.accountStatus !== "active") {
    return {
      ok: false,
      response: apiError("Your account is not approved for this action.", 403),
    };
  }

  return { ok: true, user, profile };
}
