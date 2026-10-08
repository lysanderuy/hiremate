"use client";

import { useState } from "react";

import { FieldLabel } from "@/components/shared/field-label";
import { Button } from "@/components/ui/button";
import { useCompany } from "@/hooks/use-company";
import { useUpdateCompany } from "@/hooks/use-update-company";
import { updateCompanySchema } from "@/validators/company.validator";

const fieldClassName =
  "h-11 w-full rounded-lg border border-border bg-white px-3 text-sm text-navy outline-none transition-colors placeholder:text-slate-400 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring";

export function CompanyForm() {
  const company = useCompany();

  if (company.isPending) return <p className="text-sm text-muted-foreground">Loading...</p>;

  if (company.error) {
    return (
      <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
        {company.error.message}
      </p>
    );
  }

  return <CompanyFields initialName={company.data?.name ?? ""} exists={company.data !== null} />;
}

function CompanyFields({ initialName, exists }: { initialName: string; exists: boolean }) {
  const updateCompany = useUpdateCompany();
  const [name, setName] = useState(initialName);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(false);

    const parsed = updateCompanySchema.safeParse({ name });
    if (!parsed.success) {
      setFieldError("Enter a company name of 2 to 120 characters.");
      return;
    }

    setFieldError(null);
    updateCompany.mutate(parsed.data, { onSuccess: () => setSaved(true) });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {!exists && (
        <p className="text-sm text-muted-foreground">You have not added a company yet.</p>
      )}

      <div className="space-y-2">
        <FieldLabel htmlFor="company-name" required>
          Company name
        </FieldLabel>
        <input
          id="company-name"
          name="name"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setSaved(false);
          }}
          maxLength={120}
          placeholder="Enter your company name"
          autoComplete="organization"
          aria-invalid={Boolean(fieldError)}
          aria-describedby={fieldError ? "company-name-error" : undefined}
          className={fieldClassName}
        />
        {fieldError && (
          <p id="company-name-error" role="alert" className="text-sm text-red-600">
            {fieldError}
          </p>
        )}
      </div>

      {updateCompany.error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {updateCompany.error.message}
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
          disabled={updateCompany.isPending}
          className="h-11 px-5 text-base"
        >
          {updateCompany.isPending ? "Saving..." : "Save"}
        </Button>
      </div>
    </form>
  );
}
