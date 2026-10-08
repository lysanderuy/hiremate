import type { LucideIcon } from "lucide-react";

type PagePlaceholderProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export function PagePlaceholder({ icon: Icon, title, description }: PagePlaceholderProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white px-6 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-tint text-primary">
        <Icon className="size-6" />
      </span>
      <h1 className="mt-4 text-xl font-semibold text-navy">{title}</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
