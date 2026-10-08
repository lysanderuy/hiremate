import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";

const links = [
  { label: "How it works", href: "#how" },
  { label: "AI Matching", href: "#matching" },
  { label: "FAQ", href: "#faq" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-10 border-b border-line bg-white/95 backdrop-blur-sm">
      <div className="site-container flex h-(--nav-height) items-center justify-between gap-6">
        <Logo href="/" />
        <nav aria-label="Main" className="hidden items-center gap-12 font-medium min-[961px]:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="flex min-h-10 items-center rounded-sm transition-colors hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2 min-[641px]:gap-6">
          <Link
            href="/login"
            className="hidden min-h-10 items-center rounded-sm font-medium transition-colors hover:text-ink min-[641px]:flex"
          >
            Sign In
          </Link>
          <Link href="/signup" className={cn(buttonVariants({ size: "sm" }), "max-[420px]:hidden")}>
            Get Started
          </Link>
          <MobileNav links={links} />
        </div>
      </div>
    </header>
  );
}
