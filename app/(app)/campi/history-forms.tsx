import {
  upsertFieldPacHistoryAction,
  upsertFieldUsageHistoryAction
} from "@/app/(app)/campi/actions";
import { Button } from "@/components/ui/button";

type HistoryFormsProps = {
  fieldId: string;
};

export function HistoryForms({ fieldId }: HistoryFormsProps) {
  const currentYear = new Date().getFullYear();

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <form
        action={upsertFieldUsageHistoryAction.bind(null, fieldId)}
        className="space-y-4 rounded-[8px] border border-border bg-card p-5"
      >
        <div>
          <h2 className="text-lg font-semibold">Aggiorna superficie utilizzata</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Registra un valore storico per anno. Se l&apos;anno esiste gia&apos;,
            viene aggiornata quella riga e tracciato l&apos;audit.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">
            Anno
            <input
              className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
              defaultValue={currentYear}
              name="year"
              required
              type="number"
            />
          </label>
          <label className="text-sm font-medium">
            Superficie utilizzata mq
            <input
              className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
              inputMode="decimal"
              name="usedAreaSqm"
              required
            />
          </label>
        </div>
        <label className="block text-sm font-medium">
          Nota
          <input
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            name="note"
          />
        </label>
        <Button type="submit">Registra superficie</Button>
      </form>

      <form
        action={upsertFieldPacHistoryAction.bind(null, fieldId)}
        className="space-y-4 rounded-[8px] border border-border bg-card p-5"
      >
        <div>
          <h2 className="text-lg font-semibold">Aggiorna stato PAC</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Registra lo stato PAC per anno mantenendo lo storico.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium">
            Anno
            <input
              className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
              defaultValue={currentYear}
              name="year"
              required
              type="number"
            />
          </label>
          <label className="text-sm font-medium">
            Inserito in PAC
            <select
              className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
              defaultValue="unknown"
              name="included"
            >
              <option value="unknown">Non definito</option>
              <option value="true">Si</option>
              <option value="false">No</option>
            </select>
          </label>
        </div>
        <label className="block text-sm font-medium">
          Nota
          <input
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            name="note"
          />
        </label>
        <Button type="submit">Registra PAC</Button>
      </form>
    </div>
  );
}
