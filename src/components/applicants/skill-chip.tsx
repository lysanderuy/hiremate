import { cn } from "@/lib/utils";

const CHIP_BASE = "inline-flex h-7 items-center rounded-full px-3 text-chip font-medium break-all";

export function MatchedChip({ children }: { children: React.ReactNode }) {
  return <li className={cn(CHIP_BASE, "bg-primary-soft text-primary")}>{children}</li>;
}

export function MissingChip({ children }: { children: React.ReactNode }) {
  return (
    <li
      className={cn(
        CHIP_BASE,
        "border border-dashed border-line-dashed bg-white text-muted-foreground",
      )}
    >
      {children}
    </li>
  );
}

export function MoreChip({ count }: { count: number }) {
  return (
    <li className={cn(CHIP_BASE, "bg-weak-soft text-weak")}>
      <span aria-hidden="true">+{count}</span>
      <span className="sr-only">and {count} more</span>
    </li>
  );
}
