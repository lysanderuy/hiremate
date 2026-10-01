import { NextResponse } from "next/server";

import { RECOVERY_COOKIE, RECOVERY_COOKIE_MAX_AGE, RESET_PASSWORD_PATH } from "@/lib/auth/recovery";
import { createClient } from "@/lib/supabase/server";

// Auth callback — target of email confirmation links and OAuth redirects.
// Exchanges the one-time code for a session cookie.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/dashboard";
  // Only allow same-origin relative paths — reject protocol-relative (//evil)
  // and absolute URLs so the redirect target can't be attacker-controlled.
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const response = NextResponse.redirect(`${origin}${next}`);
      // Marks a fresh recovery link so /reset-password isn't reachable with a plain session.
      if (next === RESET_PASSWORD_PATH) {
        response.cookies.set(RECOVERY_COOKIE, "1", {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: RESET_PASSWORD_PATH,
          maxAge: RECOVERY_COOKIE_MAX_AGE,
        });
      }
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Could not authenticate`);
}
