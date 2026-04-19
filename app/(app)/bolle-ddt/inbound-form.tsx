import {
  createInboundDeliveryNoteAction,
  updateInboundDeliveryNoteAction,
} from "@/app/(app)/bolle-ddt/actions";
import { InboundLinesTable } from "@/app/(app)/bolle-ddt/inbound-lines-table";
import { InboundPdfPanel } from "@/app/(app)/bolle-ddt/inbound-pdf-panel";
import { Button } from "@/components/ui/button";
import {
  getInboundDeliveryNote,
  getInboundFormData,
} from "@/lib/warehouse/queries";

export async function InboundDeliveryForm({ noteId }: { noteId?: string }) {
  const [{ suppliers, units }, note] = await Promise.all([
    getInboundFormData(),
    noteId ? getInboundDeliveryNote(noteId) : Promise.resolve(null),
  ]);
  const action = note
    ? updateInboundDeliveryNoteAction.bind(null, note.id)
    : createInboundDeliveryNoteAction;

  return (
    <form
      action={action}
      className="grid gap-6 2xl:grid-cols-[minmax(520px,0.48fr)_minmax(720px,0.52fr)]"
    >
      <div className="space-y-6 rounded-[8px] border border-border bg-card p-5">
        <div className="grid gap-4 lg:grid-cols-4">
          <label className="text-sm font-medium">
            Data documento
            <input
              className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
              defaultValue={note?.issuedOn.toISOString().slice(0, 10)}
              name="issuedOn"
              required
              type="date"
            />
          </label>
          <label className="text-sm font-medium">
            Numero bolla
            <input
              className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
              defaultValue={note?.number ?? ""}
              name="number"
              required
            />
          </label>
          <label className="text-sm font-medium">
            Fornitore
            <select
              className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
              defaultValue={note?.supplierId ?? ""}
              name="supplierId"
              required
            >
              <option value="">Seleziona</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.businessName}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            Destinatario interno
            <input
              className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
              defaultValue={note?.internalRecipient ?? ""}
              name="internalRecipient"
              placeholder="Magazzino aziendale"
            />
          </label>
        </div>
        <Button asChild variant="secondary">
          <a href="/bolle-ddt/anagrafiche">Nuova anagrafica</a>
        </Button>

        <InboundLinesTable units={units} defaultRows={note?.rows ?? []} />

        <label className="block text-sm font-medium">
          Note
          <textarea
            className="focus-ring mt-2 min-h-24 w-full rounded-[8px] border border-input bg-background px-3 py-2"
            defaultValue={note?.notes ?? ""}
            name="notes"
          />
        </label>

        <div className="flex justify-end">
          <Button type="submit">
            {note ? "Salva modifiche bolla" : "Salva bolla e carica magazzino"}
          </Button>
        </div>
      </div>
      <InboundPdfPanel />
    </form>
  );
}
