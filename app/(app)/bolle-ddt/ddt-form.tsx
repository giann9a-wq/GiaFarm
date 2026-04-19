import { createOutboundDdtAction } from "@/app/(app)/bolle-ddt/actions";
import { Button } from "@/components/ui/button";
import { getDdtFormData } from "@/lib/warehouse/queries";
import { formatDecimal } from "@/lib/warehouse/format";

export async function OutboundDdtForm() {
  const { customers, products, units, balances } = await getDdtFormData();

  return (
    <form action={createOutboundDdtAction} className="space-y-6 rounded-[8px] border border-border bg-card p-5">
      <div className="grid gap-4 lg:grid-cols-4">
        <label className="text-sm font-medium">
          Tipo DDT
          <select className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3" name="kind" required>
            <option value="WAREHOUSE">Da magazzino</option>
            <option value="FREE_TEXT">Free text / raccolto</option>
          </select>
        </label>
        <label className="text-sm font-medium">
          Data documento
          <input className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3" name="issuedOn" required type="date" />
        </label>
        <label className="text-sm font-medium">
          Destinatario esistente
          <select className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3" name="customerId">
            <option value="">Nuovo / non indicato</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>{customer.businessName}</option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Nuovo destinatario
          <input className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3" name="customerName" />
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <label className="text-sm font-medium">
          Destinazione
          <input className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3" name="destinationName" />
        </label>
        <label className="text-sm font-medium lg:col-span-2">
          Indirizzo destinazione
          <input className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3" name="destinationAddress" />
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <label className="text-sm font-medium">
          Causale
          <input className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3" name="transportReason" placeholder="Reso, vendita, trasporto raccolto" />
        </label>
        <label className="text-sm font-medium">
          Aspetto esteriore
          <input className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3" name="packageAppearance" />
        </label>
        <label className="text-sm font-medium">
          Numero colli
          <input className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3" name="packageCount" />
        </label>
        <label className="text-sm font-medium">
          Trasporto a mezzo
          <select className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3" name="transportedBy">
            <option value="">Seleziona</option>
            <option value="mittente">Mittente</option>
            <option value="destinatario">Destinatario</option>
            <option value="vettore">Vettore</option>
          </select>
        </label>
        <label className="text-sm font-medium">
          Data/ora trasporto
          <input className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3" name="transportStartsAt" type="datetime-local" />
        </label>
      </div>

      <div className="rounded-[8px] border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
        Giacenze disponibili: {balances.length === 0 ? "nessuna giacenza caricata" : balances.map((balance) => `${balance.productMaterial.name}: ${formatDecimal(balance.quantity)} ${balance.unit}${balance.lot ? ` lotto ${balance.lot}` : ""}`).join(" - ")}
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
            {Array.from({ length: 5 }, (_, index) => (
              <tr key={index}>
                <td className="px-3 py-2">
                  <select className="focus-ring h-10 w-full rounded-[8px] border border-input bg-background px-3" name={`rows.${index}.productMaterialId`}>
                    <option value="">Nessuno</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>{product.name}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input className="focus-ring h-10 w-full rounded-[8px] border border-input bg-background px-3" name={`rows.${index}.description`} />
                </td>
                <td className="px-3 py-2">
                  <input className="focus-ring h-10 w-28 rounded-[8px] border border-input bg-background px-3" inputMode="decimal" name={`rows.${index}.quantity`} />
                </td>
                <td className="px-3 py-2">
                  <input className="focus-ring h-10 w-20 rounded-[8px] border border-input bg-background px-3" list="ddt-units" name={`rows.${index}.unit`} />
                </td>
                <td className="px-3 py-2">
                  <input className="focus-ring h-10 w-28 rounded-[8px] border border-input bg-background px-3" name={`rows.${index}.lot`} />
                </td>
                <td className="px-3 py-2">
                  <input className="focus-ring h-10 w-full rounded-[8px] border border-input bg-background px-3" name={`rows.${index}.notes`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <datalist id="ddt-units">
          {units.map((unit) => <option key={unit.id} value={unit.code} />)}
        </datalist>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="text-sm font-medium">
          Firma conducente
          <input className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3" name="driverSignature" />
        </label>
        <label className="text-sm font-medium">
          Firma destinatario
          <input className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3" name="recipientSignature" />
        </label>
      </div>

      <label className="block text-sm font-medium">
        Note
        <textarea className="focus-ring mt-2 min-h-24 w-full rounded-[8px] border border-input bg-background px-3 py-2" name="notes" />
      </label>

      <div className="flex justify-end">
        <Button type="submit">Emetti DDT</Button>
      </div>
    </form>
  );
}
