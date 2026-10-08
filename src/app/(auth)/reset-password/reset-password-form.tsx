"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  AuthInput,
  clearFieldError,
  focusFirstError,
  toFieldErrors,
  type FieldErrors,
} from "@/components/auth/auth-input";
import { AuthAlert, AuthHeader } from "@/components/auth/auth-split";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { resetPasswordSchema } from "@/validators/auth.validator";
import { completeRecovery } from "./actions";

export function ResetPasswordForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError(null);
    setFieldErrors({});

    const values = Object.fromEntries(new FormData(form));
    const parsed = resetPasswordSchema.safeParse(values);
    const errors: FieldErrors = parsed.success ? {} : toFieldErrors(parsed.error);
    if (parsed.success && values.confirmPassword !== values.password) {
      errors.confirmPassword = "The passwords do not match.";
    }
    if (!parsed.success || errors.confirmPassword) {
      setFieldErrors(errors);
      focusFirstError(form, errors);
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });

    if (authError) {
      setLoading(false);
      setError(authError.message);
      return;
    }

    await completeRecovery();
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div>
      <AuthHeader title="Set a new password">
        Choose a password you have not used here before.
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
          label="New password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          required
          error={fieldErrors.password}
        />

        <AuthInput
          label="Confirm password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Enter it again"
          required
          error={fieldErrors.confirmPassword}
        />

        <Button type="submit" size="lg" disabled={loading} className="w-full text-sm">
          {loading ? "Updating..." : "Update password"}
        </Button>
      </form>
    </div>
  );
}
