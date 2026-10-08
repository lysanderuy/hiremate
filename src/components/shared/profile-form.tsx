"use client";

import { useState } from "react";

import { FieldLabel } from "@/components/shared/field-label";
import { Button } from "@/components/ui/button";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";
import { updateProfileSchema } from "@/validators/profile.validator";

const fieldClassName =
  "h-11 w-full rounded-lg border border-border bg-white px-3 text-sm text-navy outline-none transition-colors placeholder:text-slate-400 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring read-only:bg-slate-50 read-only:text-slate-600";

export function ProfileForm() {
  const profile = useProfile();

  if (profile.isPending) return <p className="text-sm text-muted-foreground">Loading...</p>;

  if (profile.error || !profile.data) {
    return (
      <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
        {profile.error?.message ?? "Profile not found."}
      </p>
    );
  }

  const { displayName, email, jobTitle } = profile.data;
  return <ProfileFields initialName={displayName ?? ""} email={email} jobTitle={jobTitle ?? ""} />;
}

type ProfileFieldsProps = { initialName: string; email: string; jobTitle: string };

function ProfileFields({ initialName, email, jobTitle }: ProfileFieldsProps) {
  const updateProfile = useUpdateProfile();
  const [displayName, setDisplayName] = useState(initialName);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(false);

    const parsed = updateProfileSchema.safeParse({ displayName });
    if (!parsed.success) {
      setFieldError("Enter a display name of 2 to 80 characters.");
      return;
    }

    setFieldError(null);
    updateProfile.mutate(parsed.data, { onSuccess: () => setSaved(true) });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="space-y-2">
        <FieldLabel htmlFor="display-name" required>
          Display name
        </FieldLabel>
        <input
          id="display-name"
          name="displayName"
          value={displayName}
          onChange={(event) => {
            setDisplayName(event.target.value);
            setSaved(false);
          }}
          maxLength={80}
          placeholder="Enter your display name"
          autoComplete="name"
          aria-invalid={Boolean(fieldError)}
          aria-describedby={fieldError ? "display-name-error" : undefined}
          className={fieldClassName}
        />
        {fieldError && (
          <p id="display-name-error" role="alert" className="text-sm text-red-600">
            {fieldError}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="profile-email" className="block text-sm font-medium text-navy">
          Email
        </label>
        <input id="profile-email" value={email} readOnly className={fieldClassName} />
      </div>

      <div className="space-y-2">
        <label htmlFor="profile-job-title" className="block text-sm font-medium text-navy">
          Job title
        </label>
        <input id="profile-job-title" value={jobTitle} readOnly className={fieldClassName} />
      </div>

      {updateProfile.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {updateProfile.error.message}
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        {saved && (
          <p role="status" className="text-sm text-emerald-700">
            Saved.
          </p>
        )}
        <Button
          type="submit"
          size="lg"
          disabled={updateProfile.isPending}
          className="h-11 px-5 text-base"
        >
          {updateProfile.isPending ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}
