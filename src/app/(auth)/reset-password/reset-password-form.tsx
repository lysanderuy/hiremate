"use client";

import { Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthInput } from "@/components/auth/auth-input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { resetPasswordSchema } from "@/validators/auth.validator";
import { completeRecovery } from "./actions";

export function ResetPasswordForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = resetPasswordSchema.safeParse(
      Object.fromEntries(new FormData(event.currentTarget)),
    );
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
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
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-navy">Set a new password</h1>
        <p className="text-sm text-muted-foreground">Use at least 8 characters.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthInput
          label="New password"
          icon={Lock}
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Enter your new password"
          minLength={8}
          required
        />

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" disabled={loading} className="h-11 w-full text-base">
          {loading ? "Updating..." : "Update password"}
        </Button>
      </form>
    </div>
  );
}
