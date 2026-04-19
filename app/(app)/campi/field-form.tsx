import { createFieldAction, updateFieldAction } from "@/app/(app)/campi/actions";
import { Button } from "@/components/ui/button";
import { formatSqm } from "@/lib/fields/format";
import { Prisma } from "@prisma/client";

type FieldFormProps = {
  field?: {
    id: string;
    municipality: string;
    cadastralSheet: string;
    cadastralParcel: string;
    commonName: string | null;
    cadastralAreaSqm: Prisma.Decimal | number | string;
    notes: string | null;
  };
};

export function FieldForm({ field }: FieldFormProps) {
  const action = field
    ? updateFieldAction.bind(null, field.id)
    : createFieldAction;

  return (
    <form action={action} className="space-y-5 rounded-[8px] border border-border bg-card p-5">
      <div className="grid gap-4 md:grid-cols-3">
        <label className="text-sm font-medium">
          Comune
          <input
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={field?.municipality ?? ""}
            name="municipality"
            required
          />
        </label>
        <label className="text-sm font-medium">
          Foglio
          <input
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={field?.cadastralSheet ?? ""}
            name="cadastralSheet"
            required
          />
        </label>
        <label className="text-sm font-medium">
          Mappale
          <input
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={field?.cadastralParcel ?? ""}
            name="cadastralParcel"
            required
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium">
          Nome comune / alias
          <input
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={field?.commonName ?? ""}
            name="commonName"
          />
        </label>
        <label className="text-sm font-medium">
          Superficie catastale mq
          <input
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={field ? formatSqm(field.cadastralAreaSqm).replace(/\./g, "") : ""}
            inputMode="decimal"
            name="cadastralAreaSqm"
            required
          />
        </label>
      </div>

      <label className="block text-sm font-medium">
        Note
        <textarea
          className="focus-ring mt-2 min-h-28 w-full rounded-[8px] border border-input bg-background px-3 py-2"
          defaultValue={field?.notes ?? ""}
          name="notes"
        />
      </label>

      <div className="flex justify-end">
        <Button type="submit">{field ? "Salva modifiche" : "Crea campo"}</Button>
      </div>
    </form>
  );
}
