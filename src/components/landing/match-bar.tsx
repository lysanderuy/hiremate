import { cn } from "@/lib/utils";

type MatchBarProps = {
  label: string;
  value: number;
  indicatorClassName: string;
  inline?: boolean;
};

export function MatchBar({ label, value, indicatorClassName, inline = false }: MatchBarProps) {
  const track = (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"
    >
      <div
        className={cn("h-full rounded-full", indicatorClassName)}
        style={{ width: `${value}%` }}
      />
    </div>
  );

  if (inline) {
    return (
      <div className="flex items-center gap-3 text-xs">
        <span className="w-16 shrink-0 sm:w-20 text-slate-500">{label}</span>
        {track}
        <span className="w-8 shrink-0 text-right font-medium text-navy">{value}%</span>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-navy">{label}</span>
        <span className="font-medium text-navy">{value}%</span>
      </div>
      <div className="flex">{track}</div>
    </div>
  );
}
