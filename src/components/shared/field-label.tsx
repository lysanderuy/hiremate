import { cn } from "@/lib/utils";

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
      className={cn("flex items-baseline gap-1 text-sm font-medium text-navy", className)}
    >
      {children}
      {required && (
        <>
          <span aria-hidden="true" className="text-red-600">
            *
          </span>
          <span className="sr-only">(required)</span>
        </>
      )}
      {optional && <span className="ml-1 text-xs font-normal text-slate-500">Optional</span>}
    </label>
  );
}
