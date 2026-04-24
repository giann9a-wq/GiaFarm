export default function AppLoading() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="h-8 w-56 animate-pulse rounded-[8px] bg-muted" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded-[8px] bg-muted" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-24 animate-pulse rounded-[8px] border border-border bg-card" />
        <div className="h-24 animate-pulse rounded-[8px] border border-border bg-card" />
        <div className="h-24 animate-pulse rounded-[8px] border border-border bg-card" />
      </div>
      <div className="h-80 animate-pulse rounded-[8px] border border-border bg-card" />
    </div>
  );
}
