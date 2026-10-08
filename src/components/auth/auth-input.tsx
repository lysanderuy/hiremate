"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";
import type { ZodError } from "zod";

import { FIELD_CLASS, FieldLabel } from "@/components/shared/field-label";
import { cn } from "@/lib/utils";

export type FieldErrors = Partial<Record<string, string>>;

export function toFieldErrors(error: ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0]);
    errors[key] ??= issue.message;
  }
  return errors;
}

export function clearFieldError(errors: FieldErrors, name: string): FieldErrors {
  if (!errors[name]) return errors;
  const next = { ...errors };
  delete next[name];
  return next;
}

export function focusFirstError(form: HTMLFormElement, errors: FieldErrors) {
  const first = Array.from(form.elements).find(
    (element): element is HTMLInputElement =>
      element instanceof HTMLInputElement && Boolean(errors[element.name]),
  );
  first?.focus();
}

type AuthInputProps = Omit<React.ComponentProps<"input">, "id"> & {
  label: string;
  error?: string;
  hint?: React.ReactNode;
  labelAction?: React.ReactNode;
};

export function AuthInput({
  label,
  error,
  hint,
  labelAction,
  required,
  type,
  className,
  ...props
}: AuthInputProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="grid gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <FieldLabel htmlFor={id} required={required}>
          {label}
        </FieldLabel>
        {labelAction}
      </div>
      <div className="relative">
        <input
          {...props}
          id={id}
          type={isPassword && showPassword ? "text" : type}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={hint ? `${hintId} ${errorId}` : errorId}
          className={cn(FIELD_CLASS, "h-11", isPassword && "pr-12", className)}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((shown) => !shown)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute top-1 right-1 flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-page hover:text-ink"
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        )}
      </div>
      {hint && <div id={hintId}>{hint}</div>}
      <p id={errorId} role="alert" className="text-chip text-error empty:hidden">
        {error}
      </p>
    </div>
  );
}
