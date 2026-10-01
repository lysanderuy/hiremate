import { FileText, Gauge, ScanSearch, Target, Users, type LucideIcon } from "lucide-react";

import { Logo } from "@/components/landing/logo";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/roles";

type PanelContent = {
  headline: string;
  description: string;
  highlights: { icon: LucideIcon; title: string; detail: string }[];
};

export const panelContent: Record<UserRole, PanelContent> = {
  applicant: {
    headline: "Find jobs that actually fit you.",
    description: "Upload your resume and see how you match before you apply.",
    highlights: [
      {
        icon: ScanSearch,
        title: "We read your resume",
        detail: "Skills, experience and education, pulled out for you",
      },
      { icon: Target, title: "Jobs ranked by fit", detail: "The best matches show up first" },
      { icon: Gauge, title: "Scores that make sense", detail: "Every match comes with the reason" },
    ],
  },
  recruiter: {
    headline: "Find the right people faster.",
    description: "Post a job and see candidates ranked by how well they match.",
    highlights: [
      { icon: Users, title: "Candidates ranked by fit", detail: "Strong matches show up first" },
      {
        icon: FileText,
        title: "Resumes already analyzed",
        detail: "Skills and experience summarized for you",
      },
      { icon: Gauge, title: "Clear match scores", detail: "See why each candidate fits" },
    ],
  },
};

type AuthSplitProps = {
  children: React.ReactNode;
  content?: PanelContent;
  step?: 1 | 2;
};

export function AuthSplit({ children, content = panelContent.applicant, step }: AuthSplitProps) {
  return (
    <main className="grid min-h-dvh lg:grid-cols-[43fr_57fr]">
      <aside className="relative hidden flex-col overflow-hidden bg-indigo-950 p-10 text-white lg:flex xl:p-14">
        <div className="relative">
          <Logo href="/" variant="light" />
        </div>

        <div className="relative my-auto max-w-lg space-y-10 py-12">
          <div className="space-y-4">
            {step && (
              <div className="flex items-center gap-2" aria-label={`Step ${step} of 2`}>
                {[1, 2].map((n) => (
                  <span
                    key={n}
                    className={cn(
                      "h-1.5 w-8 rounded-full",
                      n <= step ? "bg-primary" : "bg-white/15",
                    )}
                  />
                ))}
              </div>
            )}
            <h1 className="text-balance text-3xl leading-[1.1] font-bold tracking-tight xl:text-4xl">
              {content.headline}
            </h1>
            <p className="text-base leading-relaxed text-indigo-200">{content.description}</p>
          </div>

          <ul className="space-y-3">
            {content.highlights.map(({ icon: Icon, title, detail }) => (
              <li
                key={title}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/30 text-indigo-200">
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="text-xs text-indigo-300">{detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-indigo-300">© 2026 Talentflow AI</p>
      </aside>

      <section className="flex flex-col px-4 py-6 sm:px-6 lg:px-12 lg:py-6">
        <div className="lg:hidden">
          <Logo href="/" />
        </div>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-8 lg:py-4">
          {children}
        </div>
      </section>
    </main>
  );
}
