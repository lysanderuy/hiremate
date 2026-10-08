"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { SkillPicker } from "@/components/listings/skill-picker";
import { DiscardGuardLink } from "@/components/shared/discard-guard-link";
import { FIELD_CLASS, FieldLabel } from "@/components/shared/field-label";
import { Button, buttonVariants } from "@/components/ui/button";
import { useCreateListing } from "@/hooks/use-create-listing";
import { useCompany } from "@/hooks/use-company";
import { useUpdateListing } from "@/hooks/use-update-listing";
import { formatSalaryRange } from "@/lib/format";
import { cn } from "@/lib/utils";
import { EMPLOYMENT_TYPES, EMPLOYMENT_TYPE_LABELS, type EmploymentType } from "@/types/jobs";
import {
  createListingSchema,
  updateListingSchema,
  type ListingResponse,
} from "@/validators/listing.validator";
import { useFormGuardStore } from "@/stores/form-guard.store";
import type { SkillResponse } from "@/validators/skill.validator";

const LISTINGS_PATH = "/dashboard/recruiter/listings";
const PROFILE_PATH = "/dashboard/recruiter/profile";
const MAX_DESCRIPTION = 10000;
const MIN_DESCRIPTION = 50;
const PREVIEW_SKILL_LIMIT = 8;
const SECTION_TITLE_CLASS = "mb-4 font-display text-base font-semibold text-ink";

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
  const company = useCompany();

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
  const needsCompany = apiMessage?.includes("company name in Profile") ?? false;
  const descriptionLength = description.trim().length;

  const setGuardDirty = useFormGuardStore((state) => state.setDirty);
  const skillIds = skills.map((skill) => skill.id);
  const dirty =
    title !== (listing?.title ?? "") ||
    description !== (listing?.description ?? "") ||
    location !== (listing?.location ?? "") ||
    employmentType !== (listing?.employmentType ?? "full_time") ||
    salaryMin !== (listing?.salaryMin?.toString() ?? "") ||
    salaryMax !== (listing?.salaryMax?.toString() ?? "") ||
    skillIds.join() !== (listing?.skills ?? []).map((skill) => skill.id).join();

  const draft = {
    title,
    description,
    location,
    employmentType,
    skillIds,
    salaryMin: parseAmount(salaryMin) ?? (mode === "edit" ? null : undefined),
    salaryMax: parseAmount(salaryMax) ?? (mode === "edit" ? null : undefined),
  };
  const complete = (mode === "create" ? createListingSchema : updateListingSchema).safeParse(
    draft,
  ).success;
  const canSubmit = complete && (mode === "create" || dirty);

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

  function handleSuccess() {
    setGuardDirty(false);
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

  const minAmount = parseAmount(salaryMin);
  const maxAmount = parseAmount(salaryMax);
  const previewPay =
    minAmount !== undefined &&
    maxAmount !== undefined &&
    Number.isFinite(minAmount) &&
    Number.isFinite(maxAmount) &&
    minAmount <= maxAmount
      ? formatSalaryRange(minAmount, maxAmount)
      : "Not specified";

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="grid items-start gap-6 min-[1101px]:grid-cols-[minmax(0,1fr)_360px]"
    >
      <div className="grid gap-8 rounded-xl border border-line bg-white p-5 shadow-sm sm:p-8">
        {isRemoved && (
          <p role="alert" className="rounded-md bg-error-soft px-4 py-3 text-error">
            Removed by an administrator.
            {listing?.removalReason ? ` ${listing.removalReason}` : ""}
          </p>
        )}

        <fieldset disabled={isRemoved || pending} className="grid min-w-0 gap-8">
          <section aria-labelledby="basics-heading">
            <h2 id="basics-heading" className={SECTION_TITLE_CLASS}>
              Basics
            </h2>
            <div className="grid gap-4">
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
                  className={FIELD_CLASS}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
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
                    className={FIELD_CLASS}
                  />
                </Field>

                <Field
                  id="employmentType"
                  label="Employment type"
                  required
                  error={errors.employmentType}
                >
                  <div className="relative">
                    <select
                      id="employmentType"
                      name="employmentType"
                      value={employmentType}
                      onChange={(event) => setEmploymentType(event.target.value as EmploymentType)}
                      aria-invalid={Boolean(errors.employmentType)}
                      aria-describedby={errors.employmentType ? "employmentType-error" : undefined}
                      className={cn(FIELD_CLASS, "appearance-none pr-10")}
                    >
                      {EMPLOYMENT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {EMPLOYMENT_TYPE_LABELS[type]}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      aria-hidden="true"
                      className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-muted-foreground"
                    />
                  </div>
                </Field>
              </div>
            </div>
          </section>

          <hr className="border-line" />

          <section aria-labelledby="description-heading">
            <h2 id="description-heading" className={SECTION_TITLE_CLASS}>
              Description
            </h2>
            <Field
              id="description"
              label="Role, responsibilities and requirements"
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
                placeholder="Describe the role, responsibilities and requirements. Skills are found from this text."
                aria-invalid={Boolean(errors.description)}
                aria-describedby={
                  errors.description ? "description-error description-hint" : "description-hint"
                }
                className={cn(FIELD_CLASS, "h-auto min-h-40 resize-y py-3 leading-[1.5]")}
              />
            </Field>
          </section>

          <hr className="border-line" />

          <section aria-labelledby="pay-heading">
            <div className="mb-4 flex items-baseline gap-2">
              <h2 id="pay-heading" className="font-display text-base font-semibold text-ink">
                Pay
              </h2>
              <span className="text-xs text-muted-foreground">Optional</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="salaryMin" label="Minimum (per month)">
                <SalaryInput
                  id="salaryMin"
                  value={salaryMin}
                  onChange={setSalaryMin}
                  placeholder="25,000"
                  invalid={Boolean(errors.salary)}
                />
              </Field>
              <Field id="salaryMax" label="Maximum (per month)">
                <SalaryInput
                  id="salaryMax"
                  value={salaryMax}
                  onChange={setSalaryMax}
                  placeholder="35,000"
                  invalid={Boolean(errors.salary)}
                />
              </Field>
            </div>
            {errors.salary && (
              <p id="salary-error" role="alert" className="mt-2 text-xs text-error">
                {errors.salary}
              </p>
            )}
          </section>

          <hr className="border-line" />

          <section>
            <SkillPicker
              value={skills}
              onChange={setSkills}
              title={title}
              description={description}
            />
            {errors.skillIds && (
              <p role="alert" className="mt-2 text-xs text-error">
                {errors.skillIds}
              </p>
            )}
          </section>
        </fieldset>

        {errors.form && (
          <p role="alert" className="rounded-md bg-error-soft px-4 py-3 text-error">
            {errors.form}
          </p>
        )}

        {apiMessage && (
          <p role="alert" className="rounded-md bg-error-soft px-4 py-3 text-error">
            {apiMessage}
            {needsCompany && (
              <>
                {" "}
                <Link href={PROFILE_PATH} className="font-medium underline">
                  Go to Profile
                </Link>
              </>
            )}
          </p>
        )}

        <div className="sticky bottom-0 -mx-5 -mb-5 flex flex-wrap items-center justify-end gap-3 rounded-b-xl border-t border-line bg-white/95 px-5 py-4 backdrop-blur-sm sm:-mx-8 sm:-mb-8 sm:px-8">
          {!isRemoved && !canSubmit && (
            <p className="mr-auto text-xs text-muted-foreground">
              {mode === "create"
                ? "Complete the title, description and location to publish."
                : "Make a valid change to save."}
            </p>
          )}
          <DiscardGuardLink href={LISTINGS_PATH} className={buttonVariants({ variant: "outline" })}>
            Cancel
          </DiscardGuardLink>
          {!isRemoved && (
            <Button type="submit" disabled={pending || !canSubmit}>
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
      </div>

      <aside
        aria-label="Listing preview"
        className="rounded-xl border border-line bg-white p-5 shadow-sm min-[1101px]:sticky min-[1101px]:top-6"
      >
        <h2 className="mb-4 font-sans text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase">
          How applicants see it
        </h2>
        <p className="font-display text-base font-semibold break-words text-ink">
          {title.trim() || "Job title"}
        </p>
        <p className="text-muted-foreground">{company.data?.name ?? ""}</p>
        <dl className="my-4 grid gap-2">
          <PreviewRow label="Location" value={location.trim() || "Not set"} />
          <PreviewRow label="Type" value={EMPLOYMENT_TYPE_LABELS[employmentType]} />
          <PreviewRow label="Pay" value={previewPay} />
        </dl>
        {skills.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Skills preview">
            {skills.slice(0, PREVIEW_SKILL_LIMIT).map((skill) => (
              <li
                key={skill.id}
                className="inline-flex h-7 items-center rounded-full bg-primary-soft px-3 text-chip font-medium text-primary"
              >
                {skill.name}
              </li>
            ))}
            {skills.length > PREVIEW_SKILL_LIMIT && (
              <li className="inline-flex h-7 items-center rounded-full bg-weak-soft px-3 text-chip font-medium text-weak">
                +{skills.length - PREVIEW_SKILL_LIMIT}
              </li>
            )}
          </ul>
        )}
      </aside>
    </form>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium break-words text-ink">{value}</dd>
    </div>
  );
}

type SalaryInputProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  invalid: boolean;
};

function SalaryInput({ id, value, onChange, placeholder, invalid }: SalaryInputProps) {
  return (
    <div className="relative">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-sm font-medium text-muted-foreground"
      >
        PHP
      </span>
      <input
        id={id}
        name={id}
        type="number"
        inputMode="numeric"
        min={0}
        max={10000000}
        step={1}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={invalid}
        aria-describedby={invalid ? "salary-error" : undefined}
        className={cn(FIELD_CLASS, "pl-13")}
      />
    </div>
  );
}

type FieldProps = {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
};

function Field({ id, label, required, error, hint, children }: FieldProps) {
  return (
    <div className="grid gap-1.5">
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-error">
          {error}
        </p>
      )}
    </div>
  );
}
