import { CircleAlert, type LucideIcon } from "lucide-react";

import { Logo } from "@/components/landing/logo";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/roles";

const SCORE_BAND_CLASS = { strong: "text-strong", fair: "text-fair" } as const;

const recruiterRows = [
  { name: "Applicant A", score: 84, band: "strong" },
  { name: "Applicant B", score: 71, band: "strong" },
  { name: "Applicant C", score: 52, band: "fair" },
] as const;

function ApplicantSample() {
  return (
    <div
      className="mt-12 max-w-[380px] rounded-xl bg-white p-5 text-text shadow-md"
      aria-hidden="true"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-display text-md font-semibold text-ink">Junior Data Analyst</p>
          <p className="text-chip text-muted-foreground">Cebu City &middot; Full-time</p>
        </div>
        <p className="font-display text-numeral font-bold tracking-tight text-strong tabular-nums">
          78<span className="text-base font-medium text-muted-foreground">/100</span>
        </p>
      </div>
      <p className="mt-3 text-sm font-medium text-ink">
        Strong match. You have 6 of 8 skills this job asks for.
      </p>
    </div>
  );
}

function RecruiterSample() {
  return (
    <div
      className="mt-12 max-w-[380px] rounded-xl bg-white p-5 text-text shadow-md"
      aria-hidden="true"
    >
      <p className="font-display text-md font-semibold text-ink">
        Applicants for Junior Data Analyst
      </p>
      <ul className="mt-4 grid gap-2">
        {recruiterRows.map(({ name, score, band }) => (
          <li
            key={name}
            className="flex items-center justify-between gap-3 rounded-md border border-line px-3 py-2 text-sm"
          >
            <span className="font-semibold text-ink">{name}</span>
            <span
              className={cn("font-display text-lg font-bold tabular-nums", SCORE_BAND_CLASS[band])}
            >
              {score}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const asideCopy: Record<UserRole, { headline: string; sub: string }> = {
  applicant: {
    headline: "Know your fit before you apply.",
    sub: "See your match score, and the skills behind it, on every listing.",
  },
  recruiter: {
    headline: "Start with the best matches.",
    sub: "Post a listing and see applicants ranked by fit, with the skill gaps for each.",
  },
};

export function AuthAside({ role }: { role: UserRole }) {
  const { headline, sub } = asideCopy[role];

  return (
    <aside className="sticky top-0 hidden h-svh flex-col justify-between bg-primary px-12 py-8 text-on-primary-muted min-[961px]:flex">
      <Logo href="/" variant="light" />
      <div className="max-w-[440px]">
        <h2 className="text-hero font-bold text-balance text-white">{headline}</h2>
        <p className="mt-4 text-lead">{sub}</p>
        {role === "recruiter" ? <RecruiterSample /> : <ApplicantSample />}
      </div>
      <p className="text-sm text-primary-soft-line">&copy; 2026 TalentFlow AI</p>
    </aside>
  );
}

type AuthSplitProps = {
  children: React.ReactNode;
  role?: UserRole;
};

export function AuthSplit({ children, role = "applicant" }: AuthSplitProps) {
  return (
    <main className="grid min-h-svh min-[961px]:grid-cols-[minmax(420px,5fr)_7fr]">
      <AuthAside role={role} />
      <div className="flex min-h-svh flex-col">
        <div className="p-4 min-[961px]:hidden">
          <Logo href="/" />
        </div>
        <div className="flex flex-1 justify-center px-4 py-6 sm:px-6 min-[961px]:items-center min-[961px]:py-8">
          <div className="w-full max-w-[420px]">{children}</div>
        </div>
      </div>
    </main>
  );
}

type AuthHeaderProps = {
  title: string;
  eyebrow?: string;
  children?: React.ReactNode;
};

export function AuthHeader({ title, eyebrow, children }: AuthHeaderProps) {
  return (
    <header className="mb-6">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className="text-auth-h1 font-semibold">{title}</h1>
      {children && <p className="mt-2 text-sm text-text">{children}</p>}
    </header>
  );
}

type AuthAlertProps = {
  tone: "error" | "info";
  children: React.ReactNode;
};

export function AuthAlert({ tone, children }: AuthAlertProps) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex gap-3 rounded-md px-4 py-3 text-sm",
        tone === "error" ? "bg-error-soft text-error-strong" : "bg-primary-soft text-ink",
      )}
    >
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div className="space-y-1">{children}</div>
    </div>
  );
}

type AuthStatusIconProps = {
  icon: LucideIcon;
  tone?: "default" | "warn";
};

export function AuthStatusIcon({ icon: Icon, tone = "default" }: AuthStatusIconProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "mb-5 flex size-14 items-center justify-center rounded-xl",
        tone === "warn" ? "bg-error-soft text-error-strong" : "bg-primary-soft text-primary",
      )}
    >
      <Icon className="size-7" />
    </span>
  );
}
