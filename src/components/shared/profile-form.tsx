"use client";

import { useEffect, useState } from "react";

import { FieldLabel } from "@/components/shared/field-label";
import { Button } from "@/components/ui/button";
import { useCompany } from "@/hooks/use-company";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";
import { useUpdateCompany } from "@/hooks/use-update-company";
import { useFormGuardStore } from "@/stores/form-guard.store";
import { updateCompanySchema } from "@/validators/company.validator";
import { updateProfileSchema } from "@/validators/profile.validator";

const fieldClassName =
  "h-11 w-full rounded-lg border border-border bg-white px-3 text-sm text-navy outline-none transition-colors placeholder:text-slate-400 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring read-only:bg-slate-50 read-only:text-slate-600";

export function ProfileForm() {
  const profile = useProfile();
  const company = useCompany();

  if (profile.isPending || company.isPending) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  const error = profile.error ?? company.error;
  if (error || !profile.data) {
    return (
      <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
        {error?.message ?? "Profile not found."}
      </p>
    );
  }

  const { displayName, email, jobTitle } = profile.data;
  return (
    <ProfileFields
      initialName={displayName ?? ""}
      email={email}
      jobTitle={jobTitle ?? ""}
      initialCompany={company.data?.name ?? ""}
    />
  );
}

type ProfileFieldsProps = {
  initialName: string;
  email: string;
  jobTitle: string;
  initialCompany: string;
};

function ProfileFields({ initialName, email, jobTitle, initialCompany }: ProfileFieldsProps) {
  const updateProfile = useUpdateProfile();
  const updateCompany = useUpdateCompany();
  const [displayName, setDisplayName] = useState(initialName);
  const [companyName, setCompanyName] = useState(initialCompany);
  const [nameError, setNameError] = useState<string | null>(null);
  const [companyError, setCompanyError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const nameChanged = displayName !== initialName;
  const companyChanged = companyName !== initialCompany;
  const pending = updateProfile.isPending || updateCompany.isPending;
  const saveError = updateProfile.error ?? updateCompany.error;
  const dirty = nameChanged || companyChanged;
  const setGuardDirty = useFormGuardStore((state) => state.setDirty);

  useEffect(() => {
    setGuardDirty(dirty);
  }, [dirty, setGuardDirty]);

  useEffect(() => {
    if (!dirty) return;
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);

  useEffect(() => () => setGuardDirty(false), [setGuardDirty]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(false);

    const parsedProfile = nameChanged ? updateProfileSchema.safeParse({ displayName }) : null;
    const parsedCompany = companyChanged
      ? updateCompanySchema.safeParse({ name: companyName })
      : null;

    setNameError(
      parsedProfile && !parsedProfile.success
        ? "Enter a display name of 2 to 80 characters."
        : null,
    );
    setCompanyError(
      parsedCompany && !parsedCompany.success
        ? "Enter a company name of 2 to 120 characters."
        : null,
    );
    if (parsedProfile?.success === false || parsedCompany?.success === false) return;

    try {
      await Promise.all([
        parsedProfile?.success ? updateProfile.mutateAsync(parsedProfile.data) : null,
        parsedCompany?.success ? updateCompany.mutateAsync(parsedCompany.data) : null,
      ]);
      setSaved(true);
    } catch {
      // surfaced via the mutation error state
    }
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
          aria-invalid={Boolean(nameError)}
          aria-describedby={nameError ? "display-name-error" : undefined}
          className={fieldClassName}
        />
        {nameError && (
          <p id="display-name-error" role="alert" className="text-sm text-red-600">
            {nameError}
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

      <div className="space-y-2">
        <FieldLabel htmlFor="company-name" required>
          Company name
        </FieldLabel>
        <input
          id="company-name"
          name="companyName"
          value={companyName}
          onChange={(event) => {
            setCompanyName(event.target.value);
            setSaved(false);
          }}
          maxLength={120}
          placeholder="Enter your company name"
          autoComplete="organization"
          aria-invalid={Boolean(companyError)}
          aria-describedby={companyError ? "company-name-error" : undefined}
          className={fieldClassName}
        />
        {companyError && (
          <p id="company-name-error" role="alert" className="text-sm text-red-600">
            {companyError}
          </p>
        )}
      </div>

      {saveError && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {saveError.message}
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
          disabled={pending || (!nameChanged && !companyChanged)}
          className="h-11 px-5 text-base"
        >
          {pending ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}
