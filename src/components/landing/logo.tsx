import Link from "next/link";
import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

type LogoProps = {
  href?: string;
  variant?: "default" | "light";
};

export function Logo({ href, variant = "default" }: LogoProps) {
  const content = (
    <div className="flex shrink-0 items-center gap-2">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-white">
        <Sparkles className="size-4" />
      </span>
      <span
        className={cn(
          "whitespace-nowrap text-base font-semibold sm:text-lg",
          variant === "light" ? "text-white" : "text-navy",
        )}
      >
        Talentflow AI
      </span>
    </div>
  );

  if (!href) return content;

  return (
    <Link href={href} aria-label="Talentflow AI home" className="inline-flex">
      {content}
    </Link>
  );
}
