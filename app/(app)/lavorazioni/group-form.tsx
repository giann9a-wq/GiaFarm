import { createFieldGroupAction } from "@/app/(app)/lavorazioni/actions";
import { Button } from "@/components/ui/button";
import { getOperationsFiltersData } from "@/lib/operations/queries";

export async function FieldGroupForm() {
  const { campaigns, crops, fields } = await getOperationsFiltersData();
  const activeCampaign =
    campaigns.find((campaign) => campaign.status === "ACTIVE") ?? campaigns[0];

  return (
    <form action={createFieldGroupAction} className="space-y-5 rounded-[8px] border border-border bg-card p-5">
      <div className="grid gap-4 lg:grid-cols-3">
        <label className="text-sm font-medium">
          Campagna
          <select
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={activeCampaign?.id}
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
          <input className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3" name="name" required />
        </label>
        <label className="text-sm font-medium">
          Coltura principale
          <select className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3" name="cropId">
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
          <input className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3" name="startsOn" type="date" />
        </label>
        <label className="text-sm font-medium">
          Fine ciclo
          <input className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3" name="endsOn" type="date" />
        </label>
      </div>

      <fieldset className="rounded-[8px] border border-border p-4">
        <legend className="px-1 text-sm font-semibold">Campi nel gruppo</legend>
        <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {fields.map((field) => (
            <label className="flex items-center gap-2 text-sm" key={field.id}>
              <input className="h-4 w-4" name="fieldIds" type="checkbox" value={field.id} />
              <span>
                {field.municipality} Fg. {field.cadastralSheet} Map. {field.cadastralParcel}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block text-sm font-medium">
        Note
        <textarea className="focus-ring mt-2 min-h-20 w-full rounded-[8px] border border-input bg-background px-3 py-2" name="notes" />
      </label>

      <div className="flex justify-end">
        <Button type="submit">Crea gruppo</Button>
      </div>
    </form>
  );
}
