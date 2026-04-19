import {
  createOutboundDdtAction,
  updateOutboundDdtAction,
} from "@/app/(app)/bolle-ddt/actions";
import { Button } from "@/components/ui/button";
import { getDdtFormData, getOutboundDdt } from "@/lib/warehouse/queries";
import { formatDecimal } from "@/lib/warehouse/format";

export async function OutboundDdtForm({ ddtId }: { ddtId?: string }) {
  const [{ customers, products, units, balances }, ddt] = await Promise.all([
    getDdtFormData(),
    ddtId ? getOutboundDdt(ddtId) : Promise.resolve(null),
  ]);
  const action = ddt
    ? updateOutboundDdtAction.bind(null, ddt.id)
    : createOutboundDdtAction;

  return (
    <form
      action={action}
      className="space-y-6 rounded-[8px] border border-border bg-card p-5"
    >
      <div className="grid gap-4 lg:grid-cols-4">
        <label className="text-sm font-medium">
          Tipo DDT
          <select
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={ddt?.kind ?? "WAREHOUSE"}
            name="kind"
            required
          >
            <option value="WAREHOUSE">Da magazzino</option>
            <option value="FREE_TEXT">Free text / raccolto</option>
          </select>
        </label>
        <label className="text-sm font-medium">
          Data documento
          <input
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={ddt?.issuedOn.toISOString().slice(0, 10)}
            name="issuedOn"
            required
            type="date"
          />
        </label>
        <label className="text-sm font-medium">
          Destinatario esistente
          <select
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={ddt?.customerId ?? ""}
            name="customerId"
          >
            <option value="">Nuovo / non indicato</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.businessName}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Nuovo destinatario
          <input
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            name="customerName"
          />
        </label>
      </div>
      <Button asChild variant="secondary">
        <a href="/bolle-ddt/anagrafiche">Nuova anagrafica</a>
      </Button>

      <div className="grid gap-4 lg:grid-cols-3">
        <label className="text-sm font-medium">
          Destinazione
          <input
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={ddt?.destination?.name ?? ""}
            name="destinationName"
          />
        </label>
        <label className="text-sm font-medium lg:col-span-2">
          Indirizzo destinazione
          <input
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={ddt?.destination?.address ?? ""}
            name="destinationAddress"
          />
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <label className="text-sm font-medium">
          Causale
          <input
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={ddt?.transportReason ?? ""}
            name="transportReason"
            placeholder="Reso, vendita, trasporto raccolto"
          />
        </label>
        <label className="text-sm font-medium">
          Aspetto esteriore
          <input
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={ddt?.packageAppearance ?? ""}
            name="packageAppearance"
          />
        </label>
        <label className="text-sm font-medium">
          Numero colli
          <input
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={ddt?.packageCount ?? ""}
            name="packageCount"
          />
        </label>
        <label className="text-sm font-medium">
          Trasporto a mezzo
          <select
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={ddt?.transportedBy ?? ""}
            name="transportedBy"
          >
            <option value="">Seleziona</option>
            <option value="mittente">Mittente</option>
            <option value="destinatario">Destinatario</option>
            <option value="vettore">Vettore</option>
          </select>
        </label>
        <label className="text-sm font-medium">
          Data/ora trasporto
          <input
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={ddt?.transportStartsAt?.toISOString().slice(0, 16)}
            name="transportStartsAt"
            type="datetime-local"
          />
        </label>
      </div>

      <div className="rounded-[8px] border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
        Giacenze disponibili:{" "}
        {balances.length === 0
          ? "nessuna giacenza caricata"
          : balances
              .map(
                (balance) =>
                  `${balance.productMaterial.name}: ${formatDecimal(balance.quantity)} ${balance.unit}${balance.lot ? ` lotto ${balance.lot}` : ""}`,
              )
              .join(" - ")}
      </div>

      <div className="overflow-hidden rounded-[8px] border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-3 text-left">Materiale magazzino</th>
              <th className="px-3 py-3 text-left">Descrizione</th>
              <th className="px-3 py-3 text-left">Quantita</th>
              <th className="px-3 py-3 text-left">UM</th>
              <th className="px-3 py-3 text-left">Lotto</th>
              <th className="px-3 py-3 text-left">Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {Array.from(
              { length: Math.max(5, ddt?.rows.length ?? 0) },
              (_, index) => {
                const row = ddt?.rows[index];
                return (
                  <tr key={index}>
                    <td className="px-3 py-2">
                      <select
                        className="focus-ring h-10 w-full rounded-[8px] border border-input bg-background px-3"
                        defaultValue={row?.productMaterialId ?? ""}
                        name={`rows.${index}.productMaterialId`}
                      >
                        <option value="">Nessuno</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="focus-ring h-10 w-full rounded-[8px] border border-input bg-background px-3"
                        defaultValue={row?.description ?? ""}
                        name={`rows.${index}.description`}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="focus-ring h-10 w-28 rounded-[8px] border border-input bg-background px-3"
                        defaultValue={
                          row?.quantity
                            ? String(row.quantity).replace(".", ",")
                            : ""
                        }
                        inputMode="decimal"
                        name={`rows.${index}.quantity`}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="focus-ring h-10 w-20 rounded-[8px] border border-input bg-background px-3"
                        defaultValue={row?.unit ?? ""}
                        list="ddt-units"
                        name={`rows.${index}.unit`}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="focus-ring h-10 w-28 rounded-[8px] border border-input bg-background px-3"
                        defaultValue={row?.lot ?? ""}
                        name={`rows.${index}.lot`}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        className="focus-ring h-10 w-full rounded-[8px] border border-input bg-background px-3"
                        defaultValue={row?.notes ?? ""}
                        name={`rows.${index}.notes`}
                      />
                    </td>
                  </tr>
                );
              },
            )}
          </tbody>
        </table>
        <datalist id="ddt-units">
          {units.map((unit) => (
            <option key={unit.id} value={unit.code} />
          ))}
        </datalist>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="text-sm font-medium">
          Firma conducente
          <input
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={ddt?.driverSignature ?? ""}
            name="driverSignature"
          />
        </label>
        <label className="text-sm font-medium">
          Firma destinatario
          <input
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={ddt?.recipientSignature ?? ""}
            name="recipientSignature"
          />
        </label>
      </div>

      <label className="block text-sm font-medium">
        Note
        <textarea
          className="focus-ring mt-2 min-h-24 w-full rounded-[8px] border border-input bg-background px-3 py-2"
          defaultValue={ddt?.notes ?? ""}
          name="notes"
        />
      </label>

      <div className="flex justify-end">
        <Button type="submit">
          {ddt ? "Salva modifiche DDT" : "Emetti DDT"}
        </Button>
      </div>
    </form>
  );
}
