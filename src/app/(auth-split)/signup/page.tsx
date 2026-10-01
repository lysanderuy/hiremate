"use client";

import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Building2,
  Lock,
  Mail,
  User,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthInput } from "@/components/auth/auth-input";
import { AuthSplit, panelContent } from "@/components/auth/auth-split";
import { Button } from "@/components/ui/button";
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
  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState<UserRole>("applicant");

  return (
    <AuthSplit content={panelContent[role]} step={step === "role" ? 1 : 2}>
      <SignupForm step={step} setStep={setStep} role={role} setRole={setRole} />
    </AuthSplit>
  );
}

type SignupFormProps = {
  step: Step;
  setStep: (step: Step) => void;
  role: UserRole;
  setRole: (role: UserRole) => void;
};

function SignupForm({ step, setStep, role, setRole }: SignupFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = signUpSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
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
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-navy sm:text-3xl">
            Check your email
          </h2>
          <p className="text-sm text-muted-foreground">
            We sent a confirmation link to {submittedEmail}. Click it to finish creating your
            account.
          </p>
        </div>
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
        {resent ? (
          <p className="text-sm text-muted-foreground">Confirmation email sent again.</p>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            className="text-sm font-medium text-primary hover:text-primary-hover"
          >
            Didn&apos;t get it? Resend
          </button>
        )}
      </div>
    );
  }

  if (step === "role") {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-navy sm:text-3xl">
            Create your account
          </h2>
          <p className="text-sm text-muted-foreground">First, tell us who you are.</p>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-navy">I am a</legend>
          <div className="grid grid-cols-2 gap-3">
            {roleOptions.map(({ value, label, detail, icon: Icon }) => {
              const selected = role === value;
              return (
                <label
                  key={value}
                  className={cn(
                    "flex cursor-pointer flex-col items-center gap-2 rounded-xl border bg-white p-4 text-center transition-colors has-focus-visible:ring-3 has-focus-visible:ring-ring",
                    selected ? "border-primary bg-tint" : "border-border hover:border-tint-border",
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
                  <span
                    className={cn(
                      "flex size-10 items-center justify-center rounded-lg",
                      selected ? "bg-primary text-white" : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                  <span className="space-y-0.5">
                    <span
                      className={cn(
                        "block text-sm font-semibold",
                        selected ? "text-primary" : "text-navy",
                      )}
                    >
                      {label}
                    </span>
                    <span className="block text-xs text-muted-foreground">{detail}</span>
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
          className="h-11 w-full text-base"
        >
          Continue
          <ArrowRight />
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:text-primary-hover">
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-navy sm:text-3xl">Your details</h2>
        <p className="text-sm text-muted-foreground">
          {role === "recruiter" ? "Signing up as a recruiter." : "Signing up as an applicant."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="hidden" name="role" value={role} />

        <AuthInput
          label="Full name"
          icon={User}
          name="fullName"
          autoComplete="name"
          placeholder="Enter your full name"
          required
        />

        {role === "recruiter" && (
          <>
            <AuthInput
              label="Company"
              icon={Building2}
              name="company"
              autoComplete="organization"
              placeholder="Enter your company name"
              required
            />
            <AuthInput
              label="Job title"
              icon={Briefcase}
              name="jobTitle"
              autoComplete="organization-title"
              placeholder="Enter your job title"
              required
            />
          </>
        )}

        <AuthInput
          label="Email address"
          icon={Mail}
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Enter your email address"
          required
        />

        <AuthInput
          label="Password"
          icon={Lock}
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Enter your password"
          minLength={8}
          required
        />

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" disabled={loading} className="h-11 w-full text-base">
          {loading ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setStep("role")}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-navy"
        >
          <ArrowLeft className="size-4" />
          Back
        </button>
      </div>
    </div>
  );
}
