"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { SkillPicker } from "@/components/listings/skill-picker";
import { FieldLabel } from "@/components/shared/field-label";
import { Button, buttonVariants } from "@/components/ui/button";
import { useCreateListing } from "@/hooks/use-create-listing";
import { useUpdateListing } from "@/hooks/use-update-listing";
import { cn } from "@/lib/utils";
import { EMPLOYMENT_TYPES, EMPLOYMENT_TYPE_LABELS, type EmploymentType } from "@/types/jobs";
import {
  createListingSchema,
  updateListingSchema,
  type ListingResponse,
} from "@/validators/listing.validator";
import type { SkillResponse } from "@/validators/skill.validator";

const LISTINGS_PATH = "/dashboard/recruiter/listings";
const SETTINGS_PATH = "/dashboard/recruiter/settings";
const MAX_DESCRIPTION = 10000;
const MIN_DESCRIPTION = 50;

const fieldClassName =
  "h-11 w-full rounded-lg border border-border bg-white px-3 text-sm text-navy outline-none transition-colors placeholder:text-slate-400 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring disabled:bg-slate-50 disabled:text-slate-500";

const FIELD_MESSAGES: Record<string, string> = {
  title: "Enter a title of 3 to 120 characters.",
  description: "Enter a description of 50 to 10,000 characters.",
  location: "Enter a location of 2 to 120 characters.",
  employmentType: "Choose an employment type.",
};

const SALARY_AMOUNT_MESSAGE = "Enter whole amounts from 0 to 10,000,000.";

type FieldErrors = Partial<Record<string, string>>;

type ListingFormProps = {
  mode: "create" | "edit";
  listing?: ListingResponse;
};

function toFieldErrors(issues: { path: PropertyKey[]; message: string }[]): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of issues) {
    const field = String(issue.path[0] ?? "form");
    if (errors[field]) continue;

    if (field === "salaryMin" || field === "salaryMax") {
      errors.salary = issue.message.startsWith("Enter both")
        ? issue.message
        : SALARY_AMOUNT_MESSAGE;
    } else {
      errors[field] = FIELD_MESSAGES[field] ?? issue.message;
    }
  }
  return errors;
}

function parseAmount(value: string): number | undefined {
  const trimmed = value.trim();
  return trimmed === "" ? undefined : Number(trimmed);
}

export function ListingForm({ mode, listing }: ListingFormProps) {
  const router = useRouter();
  const createListing = useCreateListing();
  const updateListing = useUpdateListing();

  const [title, setTitle] = useState(listing?.title ?? "");
  const [description, setDescription] = useState(listing?.description ?? "");
  const [location, setLocation] = useState(listing?.location ?? "");
  const [employmentType, setEmploymentType] = useState<EmploymentType>(
    listing?.employmentType ?? "full_time",
  );
  const [salaryMin, setSalaryMin] = useState(listing?.salaryMin?.toString() ?? "");
  const [salaryMax, setSalaryMax] = useState(listing?.salaryMax?.toString() ?? "");
  const [skills, setSkills] = useState<SkillResponse[]>(listing?.skills ?? []);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [apiMessage, setApiMessage] = useState<string | null>(null);

  const isRemoved = mode === "edit" && listing?.status === "removed";
  const pending = createListing.isPending || updateListing.isPending;
  const needsCompany = apiMessage?.includes("company name in Settings") ?? false;
  const descriptionLength = description.trim().length;

  function handleSuccess() {
    router.push(LISTINGS_PATH);
  }

  function handleError(error: Error) {
    setApiMessage(error.message);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setApiMessage(null);
    if (isRemoved) return;

    const base = {
      title,
      description,
      location,
      employmentType,
      skillIds: skills.map((skill) => skill.id),
    };
    const min = parseAmount(salaryMin);
    const max = parseAmount(salaryMax);

    if (mode === "create") {
      const parsed = createListingSchema.safeParse({ ...base, salaryMin: min, salaryMax: max });
      if (!parsed.success) {
        setErrors(toFieldErrors(parsed.error.issues));
        return;
      }
      setErrors({});
      createListing.mutate(parsed.data, { onSuccess: handleSuccess, onError: handleError });
      return;
    }

    if (!listing) return;
    const parsed = updateListingSchema.safeParse({
      ...base,
      salaryMin: min ?? null,
      salaryMax: max ?? null,
    });
    if (!parsed.success) {
      setErrors(toFieldErrors(parsed.error.issues));
      return;
    }
    setErrors({});
    updateListing.mutate(
      { id: listing.id, input: parsed.data },
      { onSuccess: handleSuccess, onError: handleError },
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {isRemoved && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          Removed by an administrator.
          {listing?.removalReason ? ` ${listing.removalReason}` : ""}
        </p>
      )}

      <fieldset disabled={isRemoved || pending} className="min-w-0 space-y-5">
        <Field id="title" label="Title" required error={errors.title}>
          <input
            id="title"
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={120}
            placeholder="Enter the job title"
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? "title-error" : undefined}
            className={fieldClassName}
          />
        </Field>

        <Field
          id="description"
          label="Description"
          required
          error={errors.description}
          hint={`${descriptionLength.toLocaleString("en-US")} / ${MAX_DESCRIPTION.toLocaleString("en-US")} characters, at least ${MIN_DESCRIPTION}`}
        >
          <textarea
            id="description"
            name="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={MAX_DESCRIPTION}
            rows={10}
            placeholder="Enter the role, responsibilities and requirements"
            aria-invalid={Boolean(errors.description)}
            aria-describedby={
              errors.description ? "description-error description-hint" : "description-hint"
            }
            className={cn(fieldClassName, "h-auto min-h-40 resize-y py-2.5")}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="location" label="Location" required error={errors.location}>
            <input
              id="location"
              name="location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              maxLength={120}
              placeholder="Enter the job location"
              aria-invalid={Boolean(errors.location)}
              aria-describedby={errors.location ? "location-error" : undefined}
              className={fieldClassName}
            />
          </Field>

          <Field id="employmentType" label="Employment type" required error={errors.employmentType}>
            <select
              id="employmentType"
              name="employmentType"
              value={employmentType}
              onChange={(event) => setEmploymentType(event.target.value as EmploymentType)}
              aria-invalid={Boolean(errors.employmentType)}
              aria-describedby={errors.employmentType ? "employmentType-error" : undefined}
              className={fieldClassName}
            >
              {EMPLOYMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {EMPLOYMENT_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="space-y-2">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="salaryMin" label="Minimum salary (PHP per month)" optional>
              <input
                id="salaryMin"
                name="salaryMin"
                type="number"
                inputMode="numeric"
                min={0}
                max={10000000}
                step={1}
                placeholder="Enter the minimum amount"
                value={salaryMin}
                onChange={(event) => setSalaryMin(event.target.value)}
                aria-invalid={Boolean(errors.salary)}
                aria-describedby={errors.salary ? "salary-error" : undefined}
                className={fieldClassName}
              />
            </Field>
            <Field id="salaryMax" label="Maximum salary (PHP per month)" optional>
              <input
                id="salaryMax"
                name="salaryMax"
                type="number"
                inputMode="numeric"
                min={0}
                max={10000000}
                step={1}
                placeholder="Enter the maximum amount"
                value={salaryMax}
                onChange={(event) => setSalaryMax(event.target.value)}
                aria-invalid={Boolean(errors.salary)}
                aria-describedby={errors.salary ? "salary-error" : undefined}
                className={fieldClassName}
              />
            </Field>
          </div>
          {errors.salary && (
            <p id="salary-error" role="alert" className="text-sm text-red-600">
              {errors.salary}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <SkillPicker
            value={skills}
            onChange={setSkills}
            title={title}
            description={description}
          />
          {errors.skillIds && (
            <p role="alert" className="text-sm text-red-600">
              {errors.skillIds}
            </p>
          )}
        </div>
      </fieldset>

      {errors.form && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {errors.form}
        </p>
      )}

      {apiMessage && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {apiMessage}
          {needsCompany && (
            <>
              {" "}
              <Link href={SETTINGS_PATH} className="font-medium underline">
                Go to Settings
              </Link>
            </>
          )}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3">
        <Link
          href={LISTINGS_PATH}
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 px-5 text-base")}
        >
          Cancel
        </Link>
        {!isRemoved && (
          <Button type="submit" size="lg" disabled={pending} className="h-11 px-5 text-base">
            {pending
              ? mode === "create"
                ? "Publishing..."
                : "Saving..."
              : mode === "create"
                ? "Publish"
                : "Save changes"}
          </Button>
        )}
      </div>
    </form>
  );
}

type FieldProps = {
  id: string;
  label: string;
  required?: boolean;
  optional?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
};

function Field({ id, label, required, optional, error, hint, children }: FieldProps) {
  return (
    <div className="space-y-2">
      <FieldLabel htmlFor={id} required={required} optional={optional}>
        {label}
      </FieldLabel>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
