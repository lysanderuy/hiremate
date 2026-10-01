import { Sparkles } from "lucide-react";

export function Logo() {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-white">
        <Sparkles className="size-4" />
      </span>
      <span className="whitespace-nowrap text-base font-semibold sm:text-lg text-navy">
        Talentflow AI
      </span>
    </div>
  );
}
