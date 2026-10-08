"use client";

import { ArrowLeft, ArrowRight, Briefcase, Check, Mail, User, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import {
  AuthInput,
  clearFieldError,
  focusFirstError,
  toFieldErrors,
  type FieldErrors,
} from "@/components/auth/auth-input";
import { AuthAlert, AuthHeader, AuthSplit, AuthStatusIcon } from "@/components/auth/auth-split";
import { Button, buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/roles";
import { signUpSchema } from "@/validators/auth.validator";

const roleOptions: { value: UserRole; label: string; detail: string; icon: LucideIcon }[] = [
  { value: "applicant", label: "Applicant", detail: "Looking for jobs", icon: User },
  { value: "recruiter", label: "Recruiter", detail: "Hiring talent", icon: Briefcase },
];

type Step = "role" | "details";

export default function SignupPage() {
  return (
    <Suspense>
      <SignupFlow />
    </Suspense>
  );
}

function SignupFlow() {
  const presetRole = useSearchParams().get("role");
  const presetValid = roleOptions.some((option) => option.value === presetRole);
  const [step, setStep] = useState<Step>(presetValid ? "details" : "role");
  const [role, setRole] = useState<UserRole>(presetValid ? (presetRole as UserRole) : "applicant");
  const [navigated, setNavigated] = useState(false);

  function changeStep(next: Step) {
    setNavigated(true);
    setStep(next);
  }

  return (
    <AuthSplit role={role}>
      <SignupForm
        step={step}
        setStep={changeStep}
        role={role}
        setRole={setRole}
        focusFirstField={navigated}
      />
    </AuthSplit>
  );
}

type SignupFormProps = {
  step: Step;
  setStep: (step: Step) => void;
  role: UserRole;
  setRole: (role: UserRole) => void;
  focusFirstField: boolean;
};

function SignupForm({ step, setStep, role, setRole, focusFirstField }: SignupFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const [passwordLongEnough, setPasswordLongEnough] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError(null);
    setFieldErrors({});

    const parsed = signUpSchema.safeParse(Object.fromEntries(new FormData(form)));
    if (!parsed.success) {
      const errors = toFieldErrors(parsed.error);
      setFieldErrors(errors);
      focusFirstError(form, errors);
      return;
    }

    const { fullName, email, password, company, jobTitle } = parsed.data;

    setLoading(true);
    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/api/auth/callback`,
        data: {
          role: parsed.data.role,
          full_name: fullName,
          ...(parsed.data.role === "recruiter" && { company, job_title: jobTitle }),
        },
      },
    });

    if (authError) {
      setLoading(false);
      if (authError.code === "user_already_exists") {
        const errors = { email: "An account with this email already exists." };
        setFieldErrors(errors);
        focusFirstError(form, errors);
        return;
      }
      setError(authError.message);
      return;
    }

    // Email confirmation disabled in Supabase -> session is immediate.
    if (data.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    setLoading(false);
    setSubmittedEmail(email);
    setEmailSent(true);
  }

  async function handleResend() {
    if (!submittedEmail) return;

    const supabase = createClient();
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email: submittedEmail,
      options: { emailRedirectTo: `${location.origin}/api/auth/callback` },
    });

    if (resendError) {
      setError(resendError.message);
      return;
    }

    setError(null);
    setResent(true);
  }

  if (emailSent) {
    return (
      <div>
        <AuthStatusIcon icon={Mail} />
        <AuthHeader title="Check your email to confirm">
          We sent a confirmation link to{" "}
          <strong className="font-semibold text-ink">{submittedEmail}</strong>. Open it to finish
          creating your account.
        </AuthHeader>
        <div className="grid gap-3">
          {error && <AuthAlert tone="error">{error}</AuthAlert>}
          {resent && <AuthAlert tone="info">Confirmation email sent again.</AuthAlert>}
          <Link href="/login" className={cn(buttonVariants({ size: "lg" }), "w-full text-sm")}>
            Back to sign in
          </Link>
          {!resent && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleResend}
              className="w-full text-sm"
            >
              Send again
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (step === "role") {
    return (
      <div>
        <AuthHeader eyebrow="Step 1 of 2" title="Create your account">
          First, tell us who you are.
        </AuthHeader>

        <fieldset className="mb-6">
          <legend className="sr-only">I am a</legend>
          <div className="grid grid-cols-2 gap-3 max-[480px]:grid-cols-1">
            {roleOptions.map(({ value, label, detail, icon: Icon }) => {
              const selected = role === value;
              return (
                <label
                  key={value}
                  className={cn(
                    "relative grid cursor-pointer gap-3 rounded-xl border bg-white p-4 has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary",
                    selected
                      ? "border-primary bg-primary-soft ring-1 ring-primary"
                      : "border-line hover:border-muted-foreground",
                  )}
                >
                  <input
                    type="radio"
                    name="role"
                    value={value}
                    checked={selected}
                    onChange={() => setRole(value)}
                    className="sr-only"
                  />
                  {selected && (
                    <span
                      aria-hidden="true"
                      className="absolute top-3 right-3 flex size-5 items-center justify-center rounded-full bg-primary text-white"
                    >
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                  )}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flex size-10 items-center justify-center rounded-md",
                      selected ? "bg-primary text-white" : "bg-page text-muted-foreground",
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                  <span>
                    <span
                      className={cn(
                        "block font-display text-md font-semibold",
                        selected ? "text-primary" : "text-ink",
                      )}
                    >
                      {label}
                    </span>
                    <span className="block text-sm text-muted-foreground">{detail}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <Button
          type="button"
          size="lg"
          onClick={() => setStep("details")}
          className="w-full text-sm"
        >
          Continue
          <ArrowRight />
        </Button>

        <p className="mt-6 text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div>
      <AuthHeader eyebrow="Step 2 of 2" title="Your details">
        Signing up as {role === "recruiter" ? "a recruiter" : "an applicant"}.{" "}
        <button
          type="button"
          onClick={() => setStep("role")}
          className="rounded-sm font-medium text-primary hover:underline"
        >
          Change
        </button>
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
        <input type="hidden" name="role" value={role} />

        {error && <AuthAlert tone="error">{error}</AuthAlert>}

        <AuthInput
          label="Full name"
          name="fullName"
          autoComplete="name"
          placeholder="Enter your full name"
          required
          autoFocus={focusFirstField}
          error={fieldErrors.fullName}
        />

        {role === "recruiter" && (
          <>
            <AuthInput
              label="Company"
              name="company"
              autoComplete="organization"
              placeholder="Enter your company name"
              required
              error={fieldErrors.company}
            />
            <AuthInput
              label="Job title"
              name="jobTitle"
              autoComplete="organization-title"
              placeholder="Enter your job title"
              required
              error={fieldErrors.jobTitle}
            />
          </>
        )}

        <AuthInput
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          error={fieldErrors.email}
        />

        <AuthInput
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Create a password"
          required
          onChange={(event) => setPasswordLongEnough(event.target.value.length >= 8)}
          error={fieldErrors.password}
          hint={
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-chip",
                passwordLongEnough ? "font-medium text-primary" : "text-muted-foreground",
              )}
            >
              <Check className="size-3.5" aria-hidden="true" />
              At least 8 characters
            </span>
          }
        />

        <Button type="submit" size="lg" disabled={loading} className="w-full text-sm">
          {loading ? "Creating account..." : "Create account"}
        </Button>
      </form>

      {role === "recruiter" && (
        <p className="mt-4 text-center text-chip text-muted-foreground">
          New recruiter accounts are reviewed before you can post listings.
        </p>
      )}

      <button
        type="button"
        onClick={() => setStep("role")}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-md text-sm font-medium text-muted-foreground transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back
      </button>
    </div>
  );
}
