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
  buttonVariant: "light" | "default";
};

const panels: Panel[] = [
  {
    badge: "For Applicants",
    title: "Get noticed by the right employers",
    description: "Save your resume once and see your fit on every listing.",
    items: [
      "Save your resume as text or a text-based PDF",
      "See your score and missing skills on each listing",
      "Apply where you fit",
      "Track all your applications in one place",
    ],
    cta: "Create Applicant Account",
    href: "/signup?role=applicant",
    className: "bg-primary text-on-primary-muted",
    buttonVariant: "light",
  },
  {
    badge: "For Recruiters",
    title: "Find the best candidates, faster",
    description:
      "Post a job and see applicants ranked by fit. Spend less time sifting, more time hiring.",
    items: [
      "Post job listings and set requirements",
      "See applicants ranked by fit",
      "Read the skill gaps for each applicant",
      "Shortlist and export to CSV",
    ],
    cta: "Create Recruiter Account",
    href: "/signup?role=recruiter",
    className: "bg-night text-on-night",
    buttonVariant: "default",
  },
];

export function Cta() {
  return (
    <section id="start" className="section-screen">
      <div className="site-container">
        <div className="mx-auto mb-8 max-w-[640px] text-center">
          <h2 className="text-section font-semibold">Ready to find your best match?</h2>
          <p className="mt-3 text-lead">Create an account and pick the side that fits you.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 min-[961px]:grid-cols-2 *:min-w-0">
          {panels.map((panel) => (
            <div
              key={panel.badge}
              className={cn("flex flex-col rounded-2xl p-6 min-[641px]:p-10", panel.className)}
            >
              <Badge className="h-6 self-start bg-white/16 text-white">{panel.badge}</Badge>
              <h3 className="mt-4 mb-3 text-2xl font-semibold text-white">{panel.title}</h3>
              <p>{panel.description}</p>
              <ul className="mt-6 mb-8 grid gap-3">
                {panel.items.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <CircleCheck className="mt-[3px] size-5 shrink-0" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href={panel.href}
                className={cn(
                  buttonVariants({ variant: panel.buttonVariant, size: "lg" }),
                  "mt-auto self-start",
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
