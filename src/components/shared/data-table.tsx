import { cn } from "@/lib/utils";

export function DataTable({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table
        aria-label={label}
        className={cn(
          "w-full min-w-160 border-collapse text-left [&_tbody_tr:last-child_td]:border-b-0",
          className,
        )}
      >
        {children}
      </table>
    </div>
  );
}

export function Th({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      scope="col"
      className={cn(
        "border-y border-line bg-page px-4 py-3 text-left text-xs font-semibold tracking-[0.06em] whitespace-nowrap text-muted-foreground uppercase sm:px-5",
        className,
      )}
      {...props}
    />
  );
}

export function Td({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      className={cn("h-14 border-b border-line px-4 py-3 align-middle sm:px-5", className)}
      {...props}
    />
  );
}
