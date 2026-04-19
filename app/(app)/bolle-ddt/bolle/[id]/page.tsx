import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getInboundDeliveryNote } from "@/lib/warehouse/queries";
import { formatDate, formatDecimal, formatMovementType } from "@/lib/warehouse/format";

export default async function InboundDeliveryDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const note = await getInboundDeliveryNote(id);
  if (!note) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Bolla ${note.number}`}
        subtitle={`${formatDate(note.issuedOn)} - ${note.supplier?.businessName ?? "Fornitore non indicato"}`}
      />
      <Button asChild variant="secondary">
        <Link href="/bolle-ddt">Torna a Bolle / DDT</Link>
      </Button>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Dati documento</h2>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <p><span className="font-medium">Numero:</span> {note.number}</p>
          <p><span className="font-medium">Data:</span> {formatDate(note.issuedOn)}</p>
          <p><span className="font-medium">Fornitore:</span> {note.supplier?.businessName ?? "-"}</p>
          <p><span className="font-medium">Destinatario interno:</span> {note.internalRecipient ?? "-"}</p>
          <p className="md:col-span-2"><span className="font-medium">Note:</span> {note.notes ?? "-"}</p>
          {note.driveFile?.webViewLink ? (
            <p className="md:col-span-2">
              <a className="font-semibold text-primary" href={note.driveFile.webViewLink} target="_blank">
                Apri PDF allegato
              </a>
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Materiali e movimenti generati</h2>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Materiale</th>
                <th className="px-4 py-3 text-left">Descrizione</th>
                <th className="px-4 py-3 text-left">Quantita</th>
                <th className="px-4 py-3 text-left">Lotto</th>
                <th className="px-4 py-3 text-left">Movimenti</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {note.rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3">{row.productMaterial.name}</td>
                  <td className="px-4 py-3">{row.description ?? "-"}</td>
                  <td className="px-4 py-3">{formatDecimal(row.quantity)} {row.unit}</td>
                  <td className="px-4 py-3">{row.lot ?? "-"}</td>
                  <td className="px-4 py-3">
                    {row.warehouseMovements.map((movement) => (
                      <span key={movement.id}>
                        {formatMovementType(movement.movementType)} {formatDecimal(movement.quantity)}
                      </span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
