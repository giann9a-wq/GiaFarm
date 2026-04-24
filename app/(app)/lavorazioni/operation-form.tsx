import { createOperationAction, updateOperationAction } from "@/app/(app)/lavorazioni/actions";
import { OperationFormClient } from "@/app/(app)/lavorazioni/operation-form-client";
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
    <OperationFormClient
      action={action}
      actionError={actionError}
      campaigns={campaigns.map((campaign) => ({ id: campaign.id, name: campaign.name }))}
      defaultAreaHa={suggestedAreaHa ? formatDecimal(suggestedAreaHa, 4).replace(/\./g, "") : ""}
      defaultCampaignId={operation?.campaignId ?? selectedGroup?.campaignId ?? activeCampaign?.id}
      defaultFieldGroupId={selectedGroupId}
      defaultFieldIds={selectedFieldIds}
      defaultMaterialRows={defaultMaterialRows}
      defaultNotes={operation?.notes}
      defaultOperationTypeId={operation?.operationTypeId}
      defaultPerformedOn={operation?.performedOn.toISOString().slice(0, 10)}
      defaultReason={operation?.treatmentReason}
      existingAttachmentName={operation?.attachments[0]?.driveFile.name}
      fields={fieldOptions}
      groups={groupOptions}
      isEditing={Boolean(operation)}
      operationTypes={operationTypes.map((type) => ({
        id: type.id,
        label: `${formatCategory(type.category)} - ${type.name}`
      }))}
      products={productOptions}
      reasonSuggestions={reasons.map((item) => item.treatmentReason).filter(Boolean) as string[]}
    />
  );
}
