import { Button } from "@/components/ui/button";

import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";

const links = [
  { label: "How it works", href: "#how-it-works" },
  { label: "For Recruiters", href: "#recruiters" },
  { label: "AI Matching", href: "#ai-matching" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl px-4 sm:px-6 lg:px-8 items-center justify-between">
        <Logo />
        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="py-2 text-sm font-medium text-slate-600 transition-colors hover:text-navy"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            className="hidden h-10 px-3 lg:h-9 text-sm text-slate-700 sm:inline-flex"
          >
            Sign In
          </Button>
          <Button className="hidden h-10 px-4 text-sm min-[360px]:inline-flex lg:h-9">
            Get Started
          </Button>
          <MobileNav links={links} />
        </div>
      </div>
    </header>
  );
}
