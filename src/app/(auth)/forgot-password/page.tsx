"use client";

import { ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { AuthInput } from "@/components/auth/auth-input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { forgotPasswordSchema } from "@/validators/auth.validator";

function BackToSignIn() {
  return (
    <div className="text-center">
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-navy"
      >
        <ArrowLeft className="size-4" />
        Back to sign in
      </Link>
    </div>
  );
}

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = forgotPasswordSchema.safeParse(
      Object.fromEntries(new FormData(event.currentTarget)),
    );
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${location.origin}/api/auth/callback?next=/reset-password`,
    });
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    setSentTo(parsed.data.email);
  }

  if (sentTo) {
    return (
      <div className="space-y-6 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-tint text-primary">
          <Mail className="size-6" />
        </span>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-navy">Check your email</h1>
          <p className="text-sm text-muted-foreground">
            If an account exists for {sentTo}, we sent a link to reset your password.
          </p>
        </div>
        <BackToSignIn />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-navy">Forgot your password?</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a reset link.
        </p>
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

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" disabled={loading} className="h-11 w-full text-base">
          {loading ? "Sending..." : "Send reset link"}
        </Button>
      </form>

      <BackToSignIn />
    </div>
  );
}
