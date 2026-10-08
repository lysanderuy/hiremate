import { cn } from "@/lib/utils";

export const CRUMB_CLASS =
  "mb-4 inline-flex items-center gap-2 font-medium text-muted-foreground transition-colors hover:text-ink";

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-start justify-between gap-6", className)}>
      <div className="min-w-0">
        <h1 className="text-xl font-semibold sm:text-2xl">{title}</h1>
        {description && <p className="mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}
