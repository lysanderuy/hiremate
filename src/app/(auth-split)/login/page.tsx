"use client";

import { Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { AuthInput } from "@/components/auth/auth-input";
import { AuthSplit } from "@/components/auth/auth-split";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { signInSchema } from "@/validators/auth.validator";

// useSearchParams requires a Suspense boundary above it.
export default function LoginPage() {
  return (
    <AuthSplit>
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthSplit>
  );
}

function LoginForm() {
  const router = useRouter();
  // Errors passed by /api/auth/callback (e.g. expired confirmation link).
  const callbackError = useSearchParams().get("error");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  const displayError = error ?? (resent ? null : callbackError);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setUnconfirmedEmail(null);
    setResent(false);

    const parsed = signInSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword(parsed.data);

    if (authError) {
      setLoading(false);
      if (authError.code === "email_not_confirmed") {
        setUnconfirmedEmail(parsed.data.email);
      }
      setError(authError.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handleResend() {
    if (!unconfirmedEmail) return;

    const supabase = createClient();
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: unconfirmedEmail,
      options: { emailRedirectTo: `${location.origin}/api/auth/callback` },
    });

    if (resendError) {
      setError(resendError.message);
      return;
    }

    setError(null);
    setResent(true);
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-navy sm:text-3xl">Welcome back</h2>
        <p className="text-sm text-muted-foreground">Sign in to continue to your account.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthInput
          label="Email address"
          icon={Mail}
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Enter your email address"
          required
        />

        <AuthInput
          label="Password"
          icon={Lock}
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          required
          labelAction={
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-primary hover:text-primary-hover"
            >
              Forgot password?
            </Link>
          }
        />

        {displayError && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {displayError}
          </p>
        )}
        {unconfirmedEmail && !resent && (
          <button
            type="button"
            onClick={handleResend}
            className="text-sm font-medium text-primary hover:text-primary-hover"
          >
            Resend confirmation email
          </button>
        )}
        {resent && (
          <p className="text-sm text-muted-foreground">
            Confirmation email sent. Check your inbox.
          </p>
        )}

        <Button type="submit" size="lg" disabled={loading} className="h-11 w-full text-base">
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-primary hover:text-primary-hover">
          Create account
        </Link>
      </p>
    </div>
  );
}
