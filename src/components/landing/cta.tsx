import { CircleCheck } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Panel = {
  badge: string;
  title: string;
  description: string;
  items: string[];
  cta: string;
  href: string;
  className: string;
  descriptionClassName: string;
  buttonClassName: string;
};

const panels: Panel[] = [
  {
    badge: "For Applicants",
    title: "Get noticed by the right employers",
    description:
      "Upload once. Let AI do the heavy lifting while you focus on preparing for the right opportunity.",
    items: [
      "Upload your resume and get parsed instantly",
      "AI extracts your skills, experience, and education",
      "Discover jobs matched to your profile",
      "Track all your applications in one place",
    ],
    cta: "Create Applicant Account",
    href: "/signup?role=applicant",
    className: "bg-primary",
    descriptionClassName: "text-indigo-100",
    buttonClassName: "bg-white text-primary hover:bg-tint",
  },
  {
    badge: "For Recruiters",
    title: "Find the best candidates, faster",
    description:
      "Post a job and let AI rank your applicants by fit. Spend less time sifting, more time hiring.",
    items: [
      "Post job listings and define requirements",
      "Discover ranked candidates automatically",
      "Compare candidate profiles side by side",
      "AI-assisted shortlisting to save time",
    ],
    cta: "Create Recruiter Account",
    href: "/signup?role=recruiter",
    className: "bg-navy",
    descriptionClassName: "text-slate-300",
    buttonClassName: "bg-primary text-white hover:bg-primary-hover",
  },
];

export function Cta() {
  return (
    <section id="get-started" className="scroll-mt-16 bg-white py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl text-navy">
            Ready to find your best match?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600">
            Create a free account in under two minutes. Pick the side that fits you.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {panels.map((panel) => (
            <div
              key={panel.badge}
              className={cn(
                "flex flex-col rounded-2xl p-6 text-white sm:p-8 lg:p-10",
                panel.className,
              )}
            >
              <Badge className="h-6 w-fit border-white/20 bg-white/15 px-3 text-xs text-white">
                {panel.badge}
              </Badge>
              <h3 className="mt-6 text-balance text-2xl font-bold sm:text-3xl tracking-tight">
                {panel.title}
              </h3>
              <p className={cn("mt-4 text-base leading-relaxed", panel.descriptionClassName)}>
                {panel.description}
              </p>
              <ul className="mt-6 flex-1 space-y-3">
                {panel.items.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm sm:text-base">
                    <CircleCheck className="size-5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href={panel.href}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "mt-8 h-11 w-full px-6 text-sm sm:w-fit",
                  panel.buttonClassName,
                )}
              >
                {panel.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
