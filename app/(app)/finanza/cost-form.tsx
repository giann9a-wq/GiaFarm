import {
  createFinanceCostAction,
  updateFinanceCostAction,
} from "@/app/(app)/finanza/actions";
import { Button } from "@/components/ui/button";
import { getFinanceBaseData, getFinanceCost } from "@/lib/finance/queries";

export async function FinanceCostForm({ costId }: { costId?: string }) {
  const [{ campaigns, fieldGroups, suppliers }, cost] = await Promise.all([
    getFinanceBaseData(),
    costId ? getFinanceCost(costId) : Promise.resolve(null),
  ]);
  const action = cost
    ? updateFinanceCostAction.bind(null, cost.id)
    : createFinanceCostAction;

  return (
    <form
      action={action}
      className="space-y-6 rounded-[8px] border border-border bg-card p-5"
    >
      <div className="grid gap-4 lg:grid-cols-4">
        <label className="text-sm font-medium">
          Data documento
          <input
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={cost?.occurredOn.toISOString().slice(0, 10)}
            name="occurredOn"
            required
            type="date"
          />
        </label>
        <label className="text-sm font-medium">
          Numero documento
          <input
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={cost?.documentNumber ?? ""}
            name="documentNumber"
          />
        </label>
        <label className="text-sm font-medium">
          Fornitore
          <select
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={cost?.supplierId ?? ""}
            name="supplierId"
          >
            <option value="">Nessun fornitore</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.businessName}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Campagna
          <select
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={cost?.campaignId ?? ""}
            name="campaignId"
          >
            <option value="">Nessuna campagna</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <label className="text-sm font-medium">
          Categoria
          <input
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={cost?.category ?? ""}
            name="category"
            required
          />
        </label>
        <label className="text-sm font-medium">
          Imponibile
          <input
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={
              cost?.taxableAmount
                ? String(cost.taxableAmount).replace(".", ",")
                : ""
            }
            inputMode="decimal"
            name="taxableAmount"
          />
        </label>
        <label className="text-sm font-medium">
          IVA
          <input
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={
              cost?.vatAmount ? String(cost.vatAmount).replace(".", ",") : ""
            }
            inputMode="decimal"
            name="vatAmount"
          />
        </label>
      </div>

      <label className="block text-sm font-medium">
        Descrizione
        <textarea
          className="focus-ring mt-2 min-h-24 w-full rounded-[8px] border border-input bg-background px-3 py-2"
          defaultValue={cost?.description ?? ""}
          name="description"
          required
        />
      </label>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="text-sm font-medium">
          Totale costo
          <input
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={
              cost?.amount ? String(cost.amount).replace(".", ",") : ""
            }
            inputMode="decimal"
            name="amount"
            required
          />
        </label>
        <label className="text-sm font-medium">
          Allegato PDF
          <input
            className="focus-ring mt-2 block w-full text-sm"
            accept="application/pdf"
            name="pdf"
            type="file"
          />
        </label>
      </div>

      <fieldset className="space-y-3 rounded-[8px] border border-border p-4">
        <legend className="px-1 text-sm font-semibold">
          Allocazioni gruppi
        </legend>
        <p className="text-sm text-muted-foreground">
          Puoi valorizzare importo oppure percentuale. Il sistema converte
          sempre in importo allocato.
        </p>
        {Array.from({ length: 6 }, (_, index) => {
          const allocation = cost?.allocations[index];
          return (
            <div
              className="grid gap-3 lg:grid-cols-[2fr_1fr_1fr_2fr]"
              key={index}
            >
              <select
                className="focus-ring h-10 rounded-[8px] border border-input bg-background px-3"
                defaultValue={allocation?.fieldGroupId ?? ""}
                name={`allocations.${index}.fieldGroupId`}
              >
                <option value="">Nessun gruppo</option>
                {fieldGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.campaign.name} - {group.name}
                  </option>
                ))}
              </select>
              <input
                className="focus-ring h-10 rounded-[8px] border border-input bg-background px-3"
                defaultValue={
                  allocation?.amount
                    ? String(allocation.amount).replace(".", ",")
                    : ""
                }
                inputMode="decimal"
                name={`allocations.${index}.amount`}
                placeholder="Importo"
              />
              <input
                className="focus-ring h-10 rounded-[8px] border border-input bg-background px-3"
                inputMode="decimal"
                name={`allocations.${index}.percentage`}
                placeholder="% opz."
              />
              <input
                className="focus-ring h-10 rounded-[8px] border border-input bg-background px-3"
                defaultValue={allocation?.note ?? ""}
                name={`allocations.${index}.note`}
                placeholder="Nota allocazione"
              />
            </div>
          );
        })}
      </fieldset>

      <div className="flex justify-end">
        <Button type="submit">{cost ? "Salva costo" : "Crea costo"}</Button>
      </div>
    </form>
  );
}
