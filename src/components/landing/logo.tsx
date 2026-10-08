import Link from "next/link";

import { cn } from "@/lib/utils";

type LogoProps = {
  href?: string;
  variant?: "default" | "light" | "night";
  size?: "default" | "sm";
};

export function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M10 3l1.8 5.2L17 10l-5.2 1.8L10 17l-1.8-5.2L3 10l5.2-1.8z" />
      <path d="M18 14l.9 2.1L21 17l-2.1.9L18 20l-.9-2.1L15 17l2.1-.9z" />
    </svg>
  );
}

export function Logo({ href, variant = "default", size = "default" }: LogoProps) {
  const content = (
    <span className="flex shrink-0 items-center gap-3">
      <span
        aria-hidden="true"
        className={cn(
          "flex shrink-0 items-center justify-center rounded-[25%]",
          size === "sm" ? "size-9" : "size-[34px] min-[641px]:size-10",
          variant === "light" ? "bg-white text-primary" : "bg-primary text-white",
        )}
      >
        <SparkleIcon className={size === "sm" ? "size-5" : "size-5 min-[641px]:size-[22px]"} />
      </span>
      <span
        className={cn(
          "font-display text-base font-semibold tracking-[-0.02em] whitespace-nowrap",
          variant === "default" ? "text-ink" : "text-white",
        )}
      >
        TalentFlow AI
      </span>
    </span>
  );

  if (!href) return content;

  return (
    <Link href={href} aria-label="TalentFlow AI home" className="inline-flex rounded-md">
      {content}
    </Link>
  );
}
