"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import {
  AuthInput,
  clearFieldError,
  focusFirstError,
  toFieldErrors,
  type FieldErrors,
} from "@/components/auth/auth-input";
import { AuthAlert, AuthHeader, AuthSplit } from "@/components/auth/auth-split";
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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  const displayError = error ?? (resent ? null : callbackError);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError(null);
    setFieldErrors({});
    setUnconfirmedEmail(null);
    setResent(false);

    const parsed = signInSchema.safeParse(Object.fromEntries(new FormData(form)));
    if (!parsed.success) {
      const errors = toFieldErrors(parsed.error);
      setFieldErrors(errors);
      focusFirstError(form, errors);
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword(parsed.data);

    if (authError) {
      setLoading(false);
      if (authError.code === "email_not_confirmed") {
        setUnconfirmedEmail(parsed.data.email);
        return;
      }
      setError(
        authError.code === "invalid_credentials"
          ? "Email or password is incorrect."
          : authError.message,
      );
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
    <div>
      <AuthHeader title="Welcome back">Sign in to continue to your account.</AuthHeader>

      <form
        onSubmit={handleSubmit}
        onInput={(event) =>
          setFieldErrors((errors) =>
            clearFieldError(errors, (event.target as HTMLInputElement).name),
          )
        }
        noValidate
        className="grid gap-5"
      >
        {displayError && <AuthAlert tone="error">{displayError}</AuthAlert>}
        {unconfirmedEmail && (
          <AuthAlert tone="info">
            {resent ? (
              <p>Confirmation email sent. Check your inbox.</p>
            ) : (
              <>
                <p>Check your email to confirm your account.</p>
                <button
                  type="button"
                  onClick={handleResend}
                  className="font-medium text-primary hover:text-primary-hover hover:underline"
                >
                  Resend confirmation email
                </button>
              </>
            )}
          </AuthAlert>
        )}

        <AuthInput
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          error={fieldErrors.email}
        />

        <AuthInput
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          required
          error={fieldErrors.password}
          labelAction={
            <Link
              href="/forgot-password"
              className="rounded-sm text-sm font-medium text-primary hover:underline"
            >
              Forgot password?
            </Link>
          }
        />

        <Button type="submit" size="lg" disabled={loading} className="w-full text-sm">
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm">
        Do not have an account?{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Create account
        </Link>
      </p>
    </div>
  );
}
