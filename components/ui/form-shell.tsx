import { Button } from "@/components/ui/button";

type FormShellProps = {
  title: string;
  description: string;
};

export function FormShell({ title, description }: FormShellProps) {
  return (
    <form className="rounded-[8px] border border-dashed border-border bg-card p-5">
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium">
          Nome / riferimento
          <input
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            placeholder="Campo demo"
            type="text"
          />
        </label>
        <label className="text-sm font-medium">
          Stato
          <select className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3">
            <option>Bozza</option>
            <option>Attivo</option>
            <option>Archiviato</option>
          </select>
        </label>
      </div>
      <div className="mt-5 flex justify-end">
        <Button type="button" variant="secondary">
          Placeholder form
        </Button>
      </div>
    </form>
  );
}
