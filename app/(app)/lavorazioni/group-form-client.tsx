"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { OperationActionState } from "@/app/(app)/lavorazioni/actions";
import { Button } from "@/components/ui/button";

type FieldGroupAction = (
  state: OperationActionState,
  formData: FormData
) => Promise<OperationActionState>;

type Option = {
  id: string;
  name: string;
};

type FieldOption = {
  id: string;
  label: string;
};

type GroupFormClientProps = {
  action: FieldGroupAction;
  mode: "create" | "edit" | "duplicate";
  campaigns: Option[];
  crops: Option[];
  fields: FieldOption[];
  defaultCampaignId?: string;
  defaultName?: string;
  defaultCropId?: string | null;
  defaultStartsOn?: string;
  defaultEndsOn?: string;
  defaultFieldIds: string[];
  defaultNotes?: string | null;
};

export function GroupFormClient({
  action,
  mode,
  campaigns,
  crops,
  fields,
  defaultCampaignId,
  defaultName,
  defaultCropId,
  defaultStartsOn,
  defaultEndsOn,
  defaultFieldIds,
  defaultNotes
}: GroupFormClientProps) {
  const [state, formAction, isPending] = useActionState(action, {});
  const selectedFieldIds = new Set(defaultFieldIds);

  function inputClass(field: string) {
    return `focus-ring mt-2 h-10 w-full rounded-[8px] border bg-background px-3 ${
      state.field === field ? "border-destructive ring-2 ring-destructive/20" : "border-input"
    }`;
  }

  return (
    <form action={formAction} className="space-y-5 rounded-[8px] border border-border bg-card p-5">
      {state.error ? (
        <div className="rounded-[8px] border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}

      <div>
        <h2 className="text-lg font-semibold">
          {mode === "edit" ? "Modifica gruppo" : mode === "duplicate" ? "Duplica gruppo" : "Nuovo gruppo"}
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
          <select className={inputClass("campaignId")} defaultValue={defaultCampaignId} name="campaignId" required>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Nome gruppo
          <input className={inputClass("name")} defaultValue={defaultName} name="name" required />
        </label>
        <label className="text-sm font-medium">
          Coltura principale
          <select className={inputClass("cropId")} defaultValue={defaultCropId ?? ""} name="cropId">
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
          <input className={inputClass("startsOn")} defaultValue={defaultStartsOn} name="startsOn" type="date" />
        </label>
        <label className="text-sm font-medium">
          Fine ciclo
          <input className={inputClass("endsOn")} defaultValue={defaultEndsOn} name="endsOn" type="date" />
        </label>
      </div>

      <fieldset
        className={`rounded-[8px] border p-4 ${
          state.field === "fieldIds"
            ? "border-destructive ring-2 ring-destructive/20"
            : "border-border"
        }`}
      >
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
              <span>{field.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block text-sm font-medium">
        Note
        <textarea
          className="focus-ring mt-2 min-h-20 w-full rounded-[8px] border border-input bg-background px-3 py-2"
          defaultValue={defaultNotes ?? ""}
          name="notes"
        />
      </label>

      <div className="flex justify-end gap-3">
        <Button asChild variant="secondary">
          <Link href="/lavorazioni/gruppi">Annulla</Link>
        </Button>
        <Button disabled={isPending} type="submit">
          {isPending
            ? "Salvataggio..."
            : mode === "edit"
              ? "Salva modifiche"
              : mode === "duplicate"
                ? "Crea duplicato"
                : "Crea gruppo"}
        </Button>
      </div>
    </form>
  );
}
