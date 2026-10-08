"use client";

import { ArrowLeft, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import {
  AuthInput,
  clearFieldError,
  focusFirstError,
  toFieldErrors,
  type FieldErrors,
} from "@/components/auth/auth-input";
import { AuthAlert, AuthHeader, AuthStatusIcon } from "@/components/auth/auth-split";
import { Button, buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { forgotPasswordSchema } from "@/validators/auth.validator";

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError(null);
    setFieldErrors({});

    const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(new FormData(form)));
    if (!parsed.success) {
      const errors = toFieldErrors(parsed.error);
      setFieldErrors(errors);
      focusFirstError(form, errors);
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

    setSent(true);
  }

  if (sent) {
    return (
      <div>
        <AuthStatusIcon icon={Mail} />
        <AuthHeader title="Check your email">
          If this email has an account, a reset link is on the way.
        </AuthHeader>
        <Link href="/login" className={cn(buttonVariants({ size: "lg" }), "w-full text-sm")}>
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <AuthHeader title="Reset your password">
        Enter your email and we will send a reset link.
      </AuthHeader>

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
        {error && <AuthAlert tone="error">{error}</AuthAlert>}

        <AuthInput
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          error={fieldErrors.email}
        />

        <Button type="submit" size="lg" disabled={loading} className="w-full text-sm">
          {loading ? "Sending..." : "Send reset link"}
        </Button>
      </form>

      <Link
        href="/login"
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to sign in
      </Link>
    </div>
  );
}
