"use client";

import { useActionState } from "react";
import type { OperationActionState } from "@/app/(app)/lavorazioni/actions";
import { OperationAreaFields } from "@/app/(app)/lavorazioni/operation-area-fields";
import { OperationMaterialsFields } from "@/app/(app)/lavorazioni/operation-materials-fields";
import { Button } from "@/components/ui/button";

type OperationFormAction = (
  state: OperationActionState,
  formData: FormData
) => Promise<OperationActionState>;

type CampaignOption = {
  id: string;
  name: string;
};

type OperationTypeOption = {
  id: string;
  label: string;
};

type GroupOption = {
  id: string;
  label: string;
  areaHa: number;
  fieldIds: string[];
};

type FieldOption = {
  id: string;
  label: string;
  areaHa: number;
};

type ProductOption = {
  id: string;
  name: string;
  unit: string;
  stock: number;
};

type MaterialRow = {
  productMaterialId?: string | null;
  quantity?: string | null;
  unit?: string | null;
  note?: string | null;
};

type OperationFormClientProps = {
  action: OperationFormAction;
  actionError?: string;
  campaigns: CampaignOption[];
  operationTypes: OperationTypeOption[];
  groups: GroupOption[];
  fields: FieldOption[];
  products: ProductOption[];
  reasonSuggestions: string[];
  isEditing: boolean;
  defaultCampaignId?: string;
  defaultPerformedOn?: string;
  defaultOperationTypeId?: string;
  defaultFieldGroupId?: string;
  defaultFieldIds: string[];
  defaultAreaHa: string;
  defaultReason?: string | null;
  defaultMaterialRows: MaterialRow[];
  defaultNotes?: string | null;
  existingAttachmentName?: string;
};

export function OperationFormClient({
  action,
  actionError,
  campaigns,
  operationTypes,
  groups,
  fields,
  products,
  reasonSuggestions,
  isEditing,
  defaultCampaignId,
  defaultPerformedOn,
  defaultOperationTypeId,
  defaultFieldGroupId,
  defaultFieldIds,
  defaultAreaHa,
  defaultReason,
  defaultMaterialRows,
  defaultNotes,
  existingAttachmentName
}: OperationFormClientProps) {
  const [state, formAction, isPending] = useActionState(action, { error: actionError });
  const error = state.error ?? actionError;
  const errorField = state.field;

  function inputClass(field: string) {
    return `focus-ring mt-2 h-10 w-full rounded-[8px] border bg-background px-3 ${
      errorField === field ? "border-destructive ring-2 ring-destructive/20" : "border-input"
    }`;
  }

  return (
    <form action={formAction} className="space-y-6 rounded-[8px] border border-border bg-card p-5">
      {error ? (
        <div className="rounded-[8px] border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <label className="text-sm font-medium">
          Campagna
          <select
            className={inputClass("campaignId")}
            defaultValue={defaultCampaignId}
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
          Data
          <input
            className={inputClass("performedOn")}
            defaultValue={defaultPerformedOn}
            name="performedOn"
            required
            type="date"
          />
        </label>
        <label className="text-sm font-medium">
          Tipologia
          <select
            className={inputClass("operationTypeId")}
            defaultValue={defaultOperationTypeId ?? ""}
            name="operationTypeId"
            required
          >
            <option value="">Seleziona</option>
            {operationTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <OperationAreaFields
        defaultAreaHa={defaultAreaHa}
        errorField={errorField}
        defaultFieldGroupId={defaultFieldGroupId ?? ""}
        defaultFieldIds={defaultFieldIds}
        fields={fields}
        groups={groups}
      />

      <OperationMaterialsFields
        defaultReason={defaultReason}
        defaultRows={defaultMaterialRows}
        errorField={errorField}
        products={products}
        reasonSuggestions={reasonSuggestions}
      />

      <label className="block text-sm font-medium">
        Note
        <textarea
          className="focus-ring mt-2 min-h-24 w-full rounded-[8px] border border-input bg-background px-3 py-2"
          defaultValue={defaultNotes ?? ""}
          name="notes"
        />
      </label>

      <fieldset className="grid gap-4 rounded-[8px] border border-border p-4 lg:grid-cols-2">
        <legend className="px-1 text-sm font-semibold">Allegato PDF opzionale</legend>
        <label className="text-sm font-medium">
          Carica PDF
          <input
            accept="application/pdf"
            className="focus-ring mt-2 block w-full text-sm"
            name="attachmentFile"
            type="file"
          />
        </label>
        <label className="text-sm font-medium">
          Documento gia&apos; collegato
          <input
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={existingAttachmentName ?? ""}
            disabled
          />
        </label>
      </fieldset>

      <div className="flex justify-end">
        <Button disabled={isPending} type="submit">
          {isPending ? "Salvataggio..." : isEditing ? "Salva lavorazione" : "Crea lavorazione"}
        </Button>
      </div>
    </form>
  );
}
