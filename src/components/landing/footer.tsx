import Link from "next/link";

import { Logo } from "./logo";

const columns = [
  {
    title: "Product",
    links: [
      { label: "How it works", href: "#how" },
      { label: "AI Matching", href: "#matching" },
      { label: "FAQ", href: "#faq" },
    ],
  },
  {
    title: "Applicants",
    links: [
      { label: "Browse jobs", href: "/jobs" },
      { label: "Create account", href: "/signup?role=applicant" },
      { label: "Sign in", href: "/login" },
    ],
  },
  {
    title: "Recruiters",
    links: [
      { label: "Post a job", href: "/signup?role=recruiter" },
      { label: "Create account", href: "/signup?role=recruiter" },
      { label: "Sign in", href: "/login" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-night pt-14 pb-6 text-sm text-on-night-muted">
      <div className="site-container">
        <div className="grid grid-cols-1 gap-8 pb-12 min-[641px]:grid-cols-2 min-[961px]:grid-cols-[1.6fr_1fr_1fr_1fr] min-[961px]:gap-12">
          <div>
            <Logo href="/" variant="night" size="sm" />
            <p className="mt-4 max-w-[280px]">Job matching that shows your fit before you apply.</p>
          </div>
          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title} className="grid content-start gap-1">
              <h4 className="mb-2 font-display text-sm font-semibold text-white">{column.title}</h4>
              {column.links.map((link) => (
                <Link
                  key={`${link.label}-${link.href}`}
                  href={link.href}
                  className="flex min-h-10 items-center rounded-sm hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          ))}
        </div>
        <div className="border-t border-white/12 pt-6 text-sm">&copy; 2026 TalentFlow AI</div>
      </div>
    </footer>
  );
}
