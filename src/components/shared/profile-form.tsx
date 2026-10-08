"use client";

import { useEffect, useState } from "react";

import { FIELD_CLASS, FieldLabel } from "@/components/shared/field-label";
import { Button } from "@/components/ui/button";
import { useCompany } from "@/hooks/use-company";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";
import { useUpdateCompany } from "@/hooks/use-update-company";
import { useFormGuardStore } from "@/stores/form-guard.store";
import { updateCompanySchema } from "@/validators/company.validator";
import { updateProfileSchema } from "@/validators/profile.validator";

export function ProfileForm() {
  const profile = useProfile();
  const company = useCompany();

  if (profile.isPending || company.isPending) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  const error = profile.error ?? company.error;
  if (error || !profile.data) {
    return (
      <p role="alert" className="rounded-md bg-error-soft px-4 py-3 text-error">
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
  const [saved, setSaved] = useState(false);

  const nameChanged = displayName !== initialName;
  const companyChanged = companyName !== initialCompany;
  const pending = updateProfile.isPending || updateCompany.isPending;
  const saveError = updateProfile.error ?? updateCompany.error;
  const dirty = nameChanged || companyChanged;
  const nameError =
    nameChanged && !updateProfileSchema.safeParse({ displayName }).success
      ? "Enter a display name of 2 to 80 characters."
      : null;
  const companyError =
    companyChanged && !updateCompanySchema.safeParse({ name: companyName }).success
      ? "Enter a company name of 2 to 120 characters."
      : null;
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
    <form onSubmit={handleSubmit} noValidate className="grid gap-5">
      <div className="grid gap-1.5">
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
          className={FIELD_CLASS}
        />
        {nameError && (
          <p id="display-name-error" role="alert" className="text-xs text-error">
            {nameError}
          </p>
        )}
      </div>

      <div className="grid gap-1.5">
        <FieldLabel htmlFor="profile-email">Email</FieldLabel>
        <input
          id="profile-email"
          value={email}
          readOnly
          aria-describedby="profile-email-help"
          className={FIELD_CLASS}
        />
        <p id="profile-email-help" className="text-xs text-muted-foreground">
          Your email is your login and cannot be changed here.
        </p>
      </div>

      <div className="grid gap-1.5">
        <FieldLabel htmlFor="profile-job-title">Job title</FieldLabel>
        <input id="profile-job-title" value={jobTitle} readOnly className={FIELD_CLASS} />
      </div>

      <div className="grid gap-1.5">
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
          className={FIELD_CLASS}
        />
        {companyError && (
          <p id="company-name-error" role="alert" className="text-xs text-error">
            {companyError}
          </p>
        )}
      </div>

      {saveError && (
        <p role="alert" className="rounded-md bg-error-soft px-4 py-3 text-error">
          {saveError.message}
        </p>
      )}

      <div className="flex items-center justify-end gap-3">
        {saved && (
          <p role="status" className="text-sm text-ink">
            Profile saved.
          </p>
        )}
        <Button
          type="submit"
          disabled={pending || !dirty || Boolean(nameError) || Boolean(companyError)}
        >
          {pending ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}
