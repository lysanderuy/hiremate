"use client";

import { LogOut, Mail } from "lucide-react";
import { useEffect, useState } from "react";

import { Avatar } from "@/components/shared/avatar";
import { FIELD_CLASS, FieldLabel } from "@/components/shared/field-label";
import { LogoutButton } from "@/components/shared/logout-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { useFormGuardStore } from "@/stores/form-guard.store";
import { updateProfileSchema } from "@/validators/profile.validator";

export function ApplicantProfile() {
  const profile = useProfile();

  if (profile.isPending) return <p className="text-muted-foreground">Loading...</p>;
  if (profile.error || !profile.data) {
    return (
      <p role="alert" className="rounded-md bg-error-soft px-4 py-3 text-error">
        {profile.error?.message ?? "Profile not found."}
      </p>
    );
  }

  const { displayName, email, createdAt } = profile.data;
  return (
    <div className="grid max-w-190 gap-4">
      <IdentityCard
        initialName={displayName ?? ""}
        email={email}
        memberSince={formatDate(new Date(createdAt).toISOString())}
      />
      <PasswordCard email={email} />
      <Card className="gap-0 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">Log out</h2>
            <p className="mt-1">End your session on this device.</p>
          </div>
          <LogoutButton className="inline-flex h-10 items-center gap-2 px-5 font-semibold">
            <LogOut className="size-4" aria-hidden="true" />
            Log out
          </LogoutButton>
        </div>
      </Card>
    </div>
  );
}

type IdentityCardProps = { initialName: string; email: string; memberSince: string };

function IdentityCard({ initialName, email, memberSince }: IdentityCardProps) {
  const updateProfile = useUpdateProfile();
  const setGuardDirty = useFormGuardStore((state) => state.setDirty);
  const [displayName, setDisplayName] = useState(initialName);
  const [saved, setSaved] = useState(false);

  const changed = displayName.trim() !== initialName;
  const valid = updateProfileSchema.safeParse({ displayName }).success;
  const nameError = changed && !valid ? "Enter a name of 2 to 80 characters." : null;
  const shownName = initialName || "Applicant";

  useEffect(() => {
    setGuardDirty(changed);
  }, [changed, setGuardDirty]);

  useEffect(() => {
    if (!changed) return;
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [changed]);

  useEffect(() => () => setGuardDirty(false), [setGuardDirty]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(false);
    const parsed = updateProfileSchema.safeParse({ displayName });
    if (!parsed.success || !changed) return;
    updateProfile.mutate(parsed.data, { onSuccess: () => setSaved(true) });
  }

  return (
    <Card className="gap-0 p-5 sm:p-6">
      <div className="flex items-center gap-3 border-b border-line pb-5">
        <Avatar name={shownName} className="size-12 text-base" />
        <div className="min-w-0">
          <b className="block break-words text-ink">{shownName}</b>
          <span className="text-muted-foreground">Applicant</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="grid gap-5 pt-5">
        <div className="grid gap-1.5">
          <FieldLabel htmlFor="applicant-display-name" required>
            Display name
          </FieldLabel>
          <input
            id="applicant-display-name"
            name="displayName"
            value={displayName}
            onChange={(event) => {
              setDisplayName(event.target.value);
              setSaved(false);
            }}
            maxLength={80}
            placeholder="Enter your display name"
            autoComplete="name"
            aria-invalid={Boolean(nameError)}
            aria-describedby={nameError ? "applicant-display-name-error" : undefined}
            className={FIELD_CLASS}
          />
          {nameError && (
            <p id="applicant-display-name-error" role="alert" className="text-xs text-error">
              {nameError}
            </p>
          )}
        </div>

        <div className="grid gap-1.5">
          <FieldLabel htmlFor="applicant-email">Email</FieldLabel>
          <input
            id="applicant-email"
            value={email}
            readOnly
            aria-describedby="applicant-email-help"
            className={FIELD_CLASS}
          />
          <p id="applicant-email-help" className="text-xs text-muted-foreground">
            Your email is your login and cannot be changed here.
          </p>
        </div>

        <dl className="grid gap-1">
          <dt className="text-sm text-muted-foreground">Member since</dt>
          <dd className="font-semibold text-ink">{memberSince}</dd>
        </dl>

        {updateProfile.error && (
          <p role="alert" className="rounded-md bg-error-soft px-4 py-3 text-error">
            {updateProfile.error.message}
          </p>
        )}

        <div className="flex items-center justify-end gap-3">
          <p role="status" className="text-sm text-ink">
            {saved ? "Profile saved." : ""}
          </p>
          <Button type="submit" disabled={updateProfile.isPending || !changed || !valid}>
            {updateProfile.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function PasswordCard({ email }: { email: string }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    setSending(true);
    setSent(false);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/api/auth/callback?next=/reset-password`,
    });
    setSending(false);

    if (authError) {
      setError(authError.message);
      return;
    }
    setSent(true);
  }

  return (
    <Card className="gap-0 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">Password</h2>
          <p className="mt-1">We email you a link to set a new password.</p>
        </div>
        <Button type="button" variant="outline" onClick={handleSend} disabled={sending}>
          <Mail aria-hidden="true" />
          {sending ? "Sending..." : "Send reset link"}
        </Button>
      </div>
      <div aria-live="polite">
        {sent && <p className="mt-4 text-sm text-ink">Reset link sent. Check your email.</p>}
        {error && (
          <p role="alert" className="mt-4 rounded-md bg-error-soft px-4 py-3 text-error">
            {error}
          </p>
        )}
      </div>
    </Card>
  );
}
