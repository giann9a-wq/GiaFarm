import { createOperationAction, updateOperationAction } from "@/app/(app)/lavorazioni/actions";
import { OperationAreaFields } from "@/app/(app)/lavorazioni/operation-area-fields";
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
};

export async function OperationForm({
  operationId,
  defaultFieldGroupId,
  defaultFieldIds = []
}: OperationFormProps) {
  const { campaigns, groups, fields, operationTypes, products, operation } =
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
  const action = operation
    ? updateOperationAction.bind(null, operation.id)
    : createOperationAction;

  return (
    <form action={action} className="space-y-6 rounded-[8px] border border-border bg-card p-5">
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

      <div className="grid gap-4 lg:grid-cols-2">
        <OperationAreaFields
          groups={groupOptions}
          fields={fieldOptions}
          defaultFieldGroupId={selectedGroupId}
          defaultFieldIds={selectedFieldIds}
          defaultAreaHa={
            suggestedAreaHa ? formatDecimal(suggestedAreaHa, 4).replace(/\./g, "") : ""
          }
        />
        <label className="text-sm font-medium">
          Prodotto / materiale
          <select
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            name="productMaterialId"
            defaultValue={operation?.productMaterialId ?? ""}
          >
            <option value="">Nessun prodotto</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} ({product.unit})
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="text-sm font-medium">
          Quantita&apos;
          <input
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            inputMode="decimal"
            name="quantity"
            defaultValue={operation?.quantity ? String(operation.quantity) : ""}
          />
        </label>
        <label className="text-sm font-medium">
          Unita&apos; misura
          <input
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            name="quantityUnit"
            placeholder="kg, l, q..."
            defaultValue={operation?.quantityUnit ?? ""}
          />
        </label>
      </div>

      <label className="block text-sm font-medium">
        Motivo trattamento
        <input
          className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
          name="treatmentReason"
          defaultValue={operation?.treatmentReason ?? ""}
        />
      </label>

      <label className="block text-sm font-medium">
        Note
        <textarea
          className="focus-ring mt-2 min-h-24 w-full rounded-[8px] border border-input bg-background px-3 py-2"
          name="notes"
          defaultValue={operation?.notes ?? ""}
        />
      </label>

      <fieldset className="grid gap-4 rounded-[8px] border border-border p-4 lg:grid-cols-3">
        <legend className="px-1 text-sm font-semibold">Allegato PDF opzionale</legend>
        <label className="text-sm font-medium">
          Nome documento
          <input className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3" name="attachmentName" />
        </label>
        <label className="text-sm font-medium">
          Google Drive file id
          <input className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3" name="attachmentDriveFileId" />
        </label>
        <label className="text-sm font-medium">
          Link apertura
          <input className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3" name="attachmentUrl" type="url" />
        </label>
      </fieldset>

      <div className="flex justify-end">
        <Button type="submit">{operation ? "Salva lavorazione" : "Crea lavorazione"}</Button>
      </div>
    </form>
  );
}
