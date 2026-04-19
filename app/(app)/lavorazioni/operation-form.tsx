import { createOperationAction } from "@/app/(app)/lavorazioni/actions";
import { Button } from "@/components/ui/button";
import { formatCategory } from "@/lib/operations/format";
import { getOperationsFiltersData } from "@/lib/operations/queries";

export async function OperationForm() {
  const { campaigns, groups, fields, operationTypes, products } =
    await getOperationsFiltersData();
  const activeCampaign =
    campaigns.find((campaign) => campaign.status === "ACTIVE") ?? campaigns[0];

  return (
    <form action={createOperationAction} className="space-y-6 rounded-[8px] border border-border bg-card p-5">
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
          Data
          <input
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
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
        <label className="text-sm font-medium">
          Gruppo campi
          <select
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            name="fieldGroupId"
          >
            <option value="">Nessun gruppo</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.campaign.name} - {group.name}
                {group.crop ? ` (${group.crop.name})` : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Prodotto / materiale
          <select
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            name="productMaterialId"
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

      <fieldset className="rounded-[8px] border border-border p-4">
        <legend className="px-1 text-sm font-semibold">Campi singoli coinvolti</legend>
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
        <p className="mt-3 text-xs text-muted-foreground">
          Se scegli un gruppo, i campi del gruppo restano comunque noti al sistema. Puoi
          aggiungere campi singoli solo quando serve.
        </p>
      </fieldset>

      <div className="grid gap-4 lg:grid-cols-3">
        <label className="text-sm font-medium">
          Quantita&apos;
          <input
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            inputMode="decimal"
            name="quantity"
          />
        </label>
        <label className="text-sm font-medium">
          Unita&apos; misura
          <input
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            name="quantityUnit"
            placeholder="kg, l, q..."
          />
        </label>
        <label className="text-sm font-medium">
          Superficie trattata ha
          <input
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            inputMode="decimal"
            name="treatedAreaHa"
          />
        </label>
      </div>

      <label className="block text-sm font-medium">
        Motivo trattamento
        <input
          className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
          name="treatmentReason"
        />
      </label>

      <label className="block text-sm font-medium">
        Note
        <textarea
          className="focus-ring mt-2 min-h-24 w-full rounded-[8px] border border-input bg-background px-3 py-2"
          name="notes"
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
        <Button type="submit">Crea lavorazione</Button>
      </div>
    </form>
  );
}
