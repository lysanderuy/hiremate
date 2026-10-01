import { Logo } from "./logo";

export function Footer() {
  return (
    <footer className="border-t bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
        <Logo />
        <p className="text-center text-sm text-slate-500 sm:text-left">
          © 2026 Talentflow AI. AI-powered recruitment for everyone.
        </p>
      </div>
    </footer>
  );
}
