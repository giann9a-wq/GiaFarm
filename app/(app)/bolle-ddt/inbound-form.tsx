import { createInboundDeliveryNoteAction } from "@/app/(app)/bolle-ddt/actions";
import { InboundLinesTable } from "@/app/(app)/bolle-ddt/inbound-lines-table";
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

        <InboundLinesTable units={units} />

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
