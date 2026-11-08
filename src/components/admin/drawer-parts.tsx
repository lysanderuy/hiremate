export function DrawerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 text-chip font-semibold tracking-[0.06em] text-muted-foreground uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}

export function KeyValueList({
  label,
  items,
}: {
  label: string;
  items: [string, React.ReactNode][];
}) {
  return (
    <dl aria-label={label} className="grid gap-3">
      {items.map(([name, value]) => (
        <div key={name} className="flex justify-between gap-4">
          <dt className="text-muted-foreground">{name}</dt>
          <dd className="min-w-0 text-right font-medium break-words text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function DrawerNote({ children }: { children: React.ReactNode }) {
  return <p className="rounded-md border border-line bg-page px-4 py-3 break-words">{children}</p>;
}
