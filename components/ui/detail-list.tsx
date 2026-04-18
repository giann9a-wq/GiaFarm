type DetailListProps = {
  items: readonly (readonly [string, string])[];
};

export function DetailList({ items }: DetailListProps) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div className="rounded-[8px] border border-border bg-card p-4" key={label}>
          <dt className="text-xs font-semibold uppercase text-muted-foreground">
            {label}
          </dt>
          <dd className="mt-2 text-sm leading-6">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
