import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getDeliveryOverview } from "@/lib/warehouse/queries";
import { formatDate, formatDecimal } from "@/lib/warehouse/format";

export default async function DeliveryNotesPage() {
  const { inboundNotes, outboundDdt } = await getDeliveryOverview();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bolle / DDT"
        subtitle="Documenti di ingresso, DDT in uscita e movimenti collegati al magazzino."
      />
      <div className="flex gap-3">
        <Button asChild variant="secondary">
          <Link href="/bolle-ddt/bolle/nuova">Nuova bolla</Link>
        </Button>
        <Button asChild>
          <Link href="/bolle-ddt/ddt/nuovo">Nuovo DDT</Link>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <p className="text-sm text-muted-foreground">Bolle registrate</p>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{inboundNotes.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <p className="text-sm text-muted-foreground">DDT emessi</p>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{outboundDdt.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <p className="text-sm text-muted-foreground">Documenti con righe</p>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {inboundNotes.reduce((sum, note) => sum + note.rows.length, 0) +
                outboundDdt.reduce((sum, ddt) => sum + ddt.rows.length, 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Bolle in ingresso</h2>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Data</th>
                <th className="px-4 py-3 text-left">Numero</th>
                <th className="px-4 py-3 text-left">Fornitore</th>
                <th className="px-4 py-3 text-left">Righe</th>
                <th className="px-4 py-3 text-left">Totale Quantita</th>
                <th className="px-4 py-3 text-left">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {inboundNotes.map((note) => (
                <tr key={note.id}>
                  <td className="px-4 py-3">{formatDate(note.issuedOn)}</td>
                  <td className="px-4 py-3 font-medium">{note.number}</td>
                  <td className="px-4 py-3">{note.supplier?.businessName ?? "-"}</td>
                  <td className="px-4 py-3">{note.rows.length}</td>
                  <td className="px-4 py-3">
                    {formatDecimal(note.rows.reduce((sum, row) => sum + Number(row.quantity), 0))}
                  </td>
                  <td className="px-4 py-3">
                    <Button asChild variant="secondary">
                      <Link href={`/bolle-ddt/bolle/${note.id}`}>Dettaglio</Link>
                    </Button>
                  </td>
                </tr>
              ))}
              {inboundNotes.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-muted-foreground" colSpan={6}>
                    Nessuna bolla registrata.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">DDT in uscita</h2>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Data</th>
                <th className="px-4 py-3 text-left">Numero</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-left">Destinatario</th>
                <th className="px-4 py-3 text-left">Righe</th>
                <th className="px-4 py-3 text-left">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {outboundDdt.map((ddt) => (
                <tr key={ddt.id}>
                  <td className="px-4 py-3">{formatDate(ddt.issuedOn)}</td>
                  <td className="px-4 py-3 font-medium">{ddt.number}</td>
                  <td className="px-4 py-3">
                    {ddt.kind === "WAREHOUSE" ? "Da magazzino" : "Free text / raccolto"}
                  </td>
                  <td className="px-4 py-3">{ddt.customer?.businessName ?? "-"}</td>
                  <td className="px-4 py-3">{ddt.rows.length}</td>
                  <td className="px-4 py-3">
                    <Button asChild variant="secondary">
                      <Link href={`/bolle-ddt/ddt/${ddt.id}`}>Dettaglio</Link>
                    </Button>
                  </td>
                </tr>
              ))}
              {outboundDdt.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-muted-foreground" colSpan={6}>
                    Nessun DDT emesso.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
