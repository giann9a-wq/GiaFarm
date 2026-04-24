import Link from "next/link";
import { createFieldGroupAction, updateFieldGroupAction } from "@/app/(app)/lavorazioni/actions";
import { Button } from "@/components/ui/button";
import { getOperationsFiltersData } from "@/lib/operations/queries";

type FieldGroupFormProps = {
  mode?: "create" | "edit" | "duplicate";
  defaults?: {
    id?: string;
    campaignId?: string;
    name?: string;
    cropId?: string | null;
    startsOn?: Date | null;
    endsOn?: Date | null;
    fieldIds?: string[];
    notes?: string | null;
  };
};

function dateInputValue(value?: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "";
}

export async function FieldGroupForm({ mode = "create", defaults }: FieldGroupFormProps) {
  const { campaigns, crops, fields } = await getOperationsFiltersData();
  const activeCampaign =
    campaigns.find((campaign) => campaign.status === "ACTIVE") ?? campaigns[0];
  const selectedFieldIds = new Set(defaults?.fieldIds ?? []);
  const isEdit = mode === "edit" && defaults?.id;
  const action = isEdit
    ? updateFieldGroupAction.bind(null, defaults.id as string)
    : createFieldGroupAction;

  return (
    <form action={action} className="space-y-5 rounded-[8px] border border-border bg-card p-5">
      <div>
        <h2 className="text-lg font-semibold">
          {mode === "edit"
            ? "Modifica gruppo"
            : mode === "duplicate"
              ? "Duplica gruppo"
              : "Nuovo gruppo"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "duplicate"
            ? "La selezione dei campi e' copiata dal gruppo sorgente. Puoi cambiare nome, campagna, coltura e date prima di salvare."
            : "Compila le informazioni del gruppo e seleziona i campi collegati."}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <label className="text-sm font-medium">
          Campagna
          <select
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={defaults?.campaignId ?? activeCampaign?.id}
            name="campaignId"
            required
          >
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Nome gruppo
          <input
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={
              mode === "duplicate" && defaults?.name ? `Copia di ${defaults.name}` : defaults?.name
            }
            name="name"
            required
          />
        </label>
        <label className="text-sm font-medium">
          Coltura principale
          <select
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={defaults?.cropId ?? ""}
            name="cropId"
          >
            <option value="">Non definita</option>
            {crops.map((crop) => (
              <option key={crop.id} value={crop.id}>
                {crop.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="text-sm font-medium">
          Inizio ciclo
          <input
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={dateInputValue(defaults?.startsOn)}
            name="startsOn"
            type="date"
          />
        </label>
        <label className="text-sm font-medium">
          Fine ciclo
          <input
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={dateInputValue(defaults?.endsOn)}
            name="endsOn"
            type="date"
          />
        </label>
      </div>

      <fieldset className="rounded-[8px] border border-border p-4">
        <legend className="px-1 text-sm font-semibold">Campi nel gruppo</legend>
        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {fields.map((field) => (
            <label className="flex items-center gap-2 text-sm" key={field.id}>
              <input
                className="h-4 w-4"
                defaultChecked={selectedFieldIds.has(field.id)}
                name="fieldIds"
                type="checkbox"
                value={field.id}
              />
              <span>
                {field.municipality} Fg. {field.cadastralSheet} Map. {field.cadastralParcel}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block text-sm font-medium">
        Note
        <textarea
          className="focus-ring mt-2 min-h-20 w-full rounded-[8px] border border-input bg-background px-3 py-2"
          defaultValue={defaults?.notes ?? ""}
          name="notes"
        />
      </label>

      <div className="flex justify-end gap-3">
        <Button asChild variant="secondary">
          <Link href="/lavorazioni/gruppi">Annulla</Link>
        </Button>
        <Button type="submit">
          {mode === "edit" ? "Salva modifiche" : mode === "duplicate" ? "Crea duplicato" : "Crea gruppo"}
        </Button>
      </div>
    </form>
  );
}
