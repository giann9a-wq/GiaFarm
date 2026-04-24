import { createOperationAction, updateOperationAction } from "@/app/(app)/lavorazioni/actions";
import { OperationAreaFields } from "@/app/(app)/lavorazioni/operation-area-fields";
import { OperationMaterialsFields } from "@/app/(app)/lavorazioni/operation-materials-fields";
import { Button } from "@/components/ui/button";
import { formatCategory, formatDecimal } from "@/lib/operations/format";
import {
  fieldsUsedAreaHa,
  getOperationFormData,
  groupUsedAreaHa
} from "@/lib/operations/queries";

type OperationFormProps = {
  operationId?: string;
  defaultFieldGroupId?: string;
  defaultFieldIds?: string[];
  actionError?: string;
};

export async function OperationForm({
  operationId,
  defaultFieldGroupId,
  defaultFieldIds = [],
  actionError
}: OperationFormProps) {
  const { campaigns, groups, fields, operationTypes, products, balances, reasons, operation } =
    await getOperationFormData(operationId);
  const activeCampaign =
    campaigns.find((campaign) => campaign.status === "ACTIVE") ?? campaigns[0];
  const selectedGroupId =
    operation?.fieldGroups[0]?.fieldGroupId ?? defaultFieldGroupId ?? "";
  const selectedFieldIds =
    operation?.fields.map(({ fieldId }) => fieldId) ?? defaultFieldIds;
  const selectedGroup = groups.find((group) => group.id === selectedGroupId);
  const suggestedAreaHa =
    operation?.treatedAreaHa ??
    (selectedGroup
      ? groupUsedAreaHa(selectedGroup)
      : fieldsUsedAreaHa(fields, selectedFieldIds));
  const groupOptions = groups.map((group) => ({
    id: group.id,
    label: `${group.campaign.name} - ${group.name}${group.crop ? ` (${group.crop.name})` : ""}`,
    areaHa: groupUsedAreaHa(group),
    fieldIds: group.memberships.map((membership) => membership.field.id)
  }));
  const fieldOptions = fields.map((field) => ({
    id: field.id,
    label: `${field.municipality} Fg. ${field.cadastralSheet} Map. ${field.cadastralParcel}`,
    areaHa: fieldsUsedAreaHa([field], [field.id])
  }));
  const productOptions = products.map((product) => ({
    id: product.id,
    name: product.name,
    unit: product.unit,
    stock: balances
      .filter((balance) => balance.productMaterialId === product.id)
      .reduce((sum, balance) => sum + Number(balance.quantity), 0)
  }));
  const defaultMaterialRows =
    operation?.materialUsages.length
      ? operation.materialUsages.map((usage) => ({
          productMaterialId: usage.productMaterialId,
          quantity: String(usage.quantity),
          unit: usage.unit,
          note: usage.note
        }))
      : operation?.productMaterialId
        ? [
            {
              productMaterialId: operation.productMaterialId,
              quantity: operation.quantity ? String(operation.quantity) : "",
              unit: operation.quantityUnit,
              note: ""
            }
          ]
        : [];
  const action = operation
    ? updateOperationAction.bind(null, operation.id)
    : createOperationAction;

  return (
    <form action={action} className="space-y-6 rounded-[8px] border border-border bg-card p-5">
      {actionError ? (
        <div className="rounded-[8px] border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {actionError}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <label className="text-sm font-medium">
          Campagna
          <select
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={operation?.campaignId ?? selectedGroup?.campaignId ?? activeCampaign?.id}
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
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={operation?.performedOn.toISOString().slice(0, 10)}
            name="performedOn"
            required
            type="date"
          />
        </label>
        <label className="text-sm font-medium">
          Tipologia
          <select
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            name="operationTypeId"
            required
            defaultValue={operation?.operationTypeId ?? ""}
          >
            <option value="">Seleziona</option>
            {operationTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {formatCategory(type.category)} - {type.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-1">
        <OperationAreaFields
          groups={groupOptions}
          fields={fieldOptions}
          defaultFieldGroupId={selectedGroupId}
          defaultFieldIds={selectedFieldIds}
          defaultAreaHa={
            suggestedAreaHa ? formatDecimal(suggestedAreaHa, 4).replace(/\./g, "") : ""
          }
        />
      </div>

      <OperationMaterialsFields
        products={productOptions}
        defaultReason={operation?.treatmentReason}
        defaultRows={defaultMaterialRows}
        reasonSuggestions={reasons.map((item) => item.treatmentReason).filter(Boolean) as string[]}
      />

      <label className="block text-sm font-medium">
        Note
        <textarea
          className="focus-ring mt-2 min-h-24 w-full rounded-[8px] border border-input bg-background px-3 py-2"
          name="notes"
          defaultValue={operation?.notes ?? ""}
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
            defaultValue={operation?.attachments[0]?.driveFile.name ?? ""}
            disabled
          />
        </label>
      </fieldset>

      <div className="flex justify-end">
        <Button type="submit">{operation ? "Salva lavorazione" : "Crea lavorazione"}</Button>
      </div>
    </form>
  );
}
