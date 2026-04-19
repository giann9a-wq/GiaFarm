import { createInboundDeliveryNoteAction } from "@/app/(app)/bolle-ddt/actions";
import { InboundPdfPanel } from "@/app/(app)/bolle-ddt/inbound-pdf-panel";
import { Button } from "@/components/ui/button";
import { getInboundFormData } from "@/lib/warehouse/queries";

export async function InboundDeliveryForm() {
  const { suppliers, units } = await getInboundFormData();

  return (
    <form
      action={createInboundDeliveryNoteAction}
      className="grid gap-6 2xl:grid-cols-[minmax(520px,0.48fr)_minmax(720px,0.52fr)]"
    >
      <div className="space-y-6 rounded-[8px] border border-border bg-card p-5">
        <div className="grid gap-4 lg:grid-cols-4">
          <label className="text-sm font-medium">
            Data documento
            <input className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3" name="issuedOn" required type="date" />
          </label>
          <label className="text-sm font-medium">
            Numero bolla
            <input className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3" name="number" required />
          </label>
          <label className="text-sm font-medium">
            Fornitore
            <select className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3" name="supplierId" required>
              <option value="">Seleziona</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>{supplier.businessName}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            Destinatario interno
            <input className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3" name="internalRecipient" placeholder="Magazzino aziendale" />
          </label>
        </div>

        <div className="overflow-x-auto rounded-[8px] border border-border">
          <table className="min-w-[980px] w-full text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-3 text-left">Cod. Articolo</th>
                <th className="px-3 py-3 text-left">Descrizione</th>
                <th className="px-3 py-3 text-left">Nr. Reg.</th>
                <th className="px-3 py-3 text-left">UM</th>
                <th className="px-3 py-3 text-left">Quantita</th>
                <th className="px-3 py-3 text-left">Prezzo</th>
                <th className="px-3 py-3 text-left">Importo riga</th>
                <th className="px-3 py-3 text-left">C.I.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {Array.from({ length: 5 }, (_, index) => (
                <tr key={index}>
                  <td className="px-3 py-2">
                    <input className="focus-ring h-10 w-32 rounded-[8px] border border-input bg-background px-3" name={`rows.${index}.articleCode`} />
                  </td>
                  <td className="px-3 py-2">
                    <input className="focus-ring h-10 w-64 rounded-[8px] border border-input bg-background px-3" name={`rows.${index}.description`} />
                  </td>
                  <td className="px-3 py-2">
                    <input className="focus-ring h-10 w-24 rounded-[8px] border border-input bg-background px-3" name={`rows.${index}.registrationNumber`} />
                  </td>
                  <td className="px-3 py-2">
                    <input className="focus-ring h-10 w-20 rounded-[8px] border border-input bg-background px-3" list="units" name={`rows.${index}.unit`} />
                  </td>
                  <td className="px-3 py-2">
                    <input className="focus-ring h-10 w-24 rounded-[8px] border border-input bg-background px-3" inputMode="decimal" name={`rows.${index}.quantity`} />
                  </td>
                  <td className="px-3 py-2">
                    <input className="focus-ring h-10 w-24 rounded-[8px] border border-input bg-background px-3" inputMode="decimal" name={`rows.${index}.unitPrice`} />
                  </td>
                  <td className="px-3 py-2">
                    <input className="focus-ring h-10 w-28 rounded-[8px] border border-input bg-background px-3" inputMode="decimal" name={`rows.${index}.lineAmount`} />
                  </td>
                  <td className="px-3 py-2">
                    <input className="focus-ring h-10 w-16 rounded-[8px] border border-input bg-background px-3" name={`rows.${index}.ciCode`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <datalist id="units">
            {units.map((unit) => <option key={unit.id} value={unit.code} />)}
          </datalist>
        </div>

        <label className="block text-sm font-medium">
          Note
          <textarea className="focus-ring mt-2 min-h-24 w-full rounded-[8px] border border-input bg-background px-3 py-2" name="notes" />
        </label>

        <div className="flex justify-end">
          <Button type="submit">Salva bolla e carica magazzino</Button>
        </div>
      </div>
      <InboundPdfPanel />
    </form>
  );
}
