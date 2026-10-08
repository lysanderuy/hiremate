import { cn } from "@/lib/utils";

export const FIELD_CLASS =
  "h-10 w-full rounded-md border border-line bg-white px-3.5 text-base text-ink max-sm:h-11 sm:text-sm outline-none transition-colors placeholder:text-[#98a2b3] focus-visible:border-primary focus-visible:shadow-focus aria-invalid:border-error read-only:bg-page read-only:text-muted-foreground disabled:bg-page disabled:text-muted-foreground";

type FieldLabelProps = {
  htmlFor: string;
  required?: boolean;
  optional?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function FieldLabel({ htmlFor, required, optional, className, children }: FieldLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn("flex items-baseline text-sm font-medium text-ink", className)}
    >
      {children}
      {required && (
        <>
          <span aria-hidden="true" className="ml-0.5 text-error">
            *
          </span>
          <span className="sr-only">(required)</span>
        </>
      )}
      {optional && <span className="ml-2 text-xs font-normal text-muted-foreground">Optional</span>}
    </label>
  );
}
