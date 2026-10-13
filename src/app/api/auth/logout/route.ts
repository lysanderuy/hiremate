import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

// Server components cannot clear cookies, so suspended users are redirected here to sign out.
export async function GET(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const url = new URL("/login", request.url);
  url.search = new URLSearchParams({ error: "This account is suspended." }).toString();
  return NextResponse.redirect(url, { status: 302 });
}

// Logout via plain form POST — no client JS needed.
export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL("/login", request.url), { status: 302 });
}
