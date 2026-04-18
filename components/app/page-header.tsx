import { Button } from "@/components/ui/button";

type PageHeaderProps = {
  title: string;
  subtitle: string;
  actionLabel?: string;
};

export function PageHeader({ title, subtitle, actionLabel }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          {subtitle}
        </p>
      </div>
      {actionLabel ? (
        <Button className="shrink-0" variant="primary">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
