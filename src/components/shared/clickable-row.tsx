import { cn } from "@/lib/utils";

export function ClickableRow({
  onActivate,
  className,
  ...props
}: React.ComponentProps<"tr"> & { onActivate: () => void }) {
  return (
    <tr
      role="button"
      tabIndex={0}
      onClick={(event) => {
        if (event.target instanceof Element && event.target.closest("a, button")) return;
        onActivate();
      }}
      onKeyDown={(event) => {
        if ((event.key === "Enter" || event.key === " ") && event.target === event.currentTarget) {
          event.preventDefault();
          onActivate();
        }
      }}
      className={cn(
        "cursor-pointer hover:bg-primary-soft/40 focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-primary",
        className,
      )}
      {...props}
    />
  );
}
