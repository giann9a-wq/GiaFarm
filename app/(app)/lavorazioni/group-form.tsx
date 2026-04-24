import { createFieldGroupAction, updateFieldGroupAction } from "@/app/(app)/lavorazioni/actions";
import { GroupFormClient } from "@/app/(app)/lavorazioni/group-form-client";
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
    <GroupFormClient
      action={action}
      campaigns={campaigns.map((campaign) => ({ id: campaign.id, name: campaign.name }))}
      crops={crops.map((crop) => ({ id: crop.id, name: crop.name }))}
      defaultCampaignId={defaults?.campaignId ?? activeCampaign?.id}
      defaultCropId={defaults?.cropId}
      defaultEndsOn={dateInputValue(defaults?.endsOn)}
      defaultFieldIds={Array.from(selectedFieldIds)}
      defaultName={
        mode === "duplicate" && defaults?.name ? `Copia di ${defaults.name}` : defaults?.name
      }
      defaultNotes={defaults?.notes}
      defaultStartsOn={dateInputValue(defaults?.startsOn)}
      fields={fields.map((field) => ({
        id: field.id,
        label: `${field.municipality} Fg. ${field.cadastralSheet} Map. ${field.cadastralParcel}`
      }))}
      mode={mode}
    />
  );
}
