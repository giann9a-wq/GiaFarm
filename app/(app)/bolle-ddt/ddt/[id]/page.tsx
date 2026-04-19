import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getOutboundDdt } from "@/lib/warehouse/queries";
import { formatDate, formatDateTime, formatDecimal } from "@/lib/warehouse/format";

export default async function OutboundDdtDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ddt = await getOutboundDdt(id);
  if (!ddt) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`DDT ${ddt.number}`}
        subtitle={`${formatDate(ddt.issuedOn)} - ${ddt.kind === "WAREHOUSE" ? "Da magazzino" : "Free text / raccolto"}`}
      />
      <Button asChild variant="secondary">
        <Link href="/bolle-ddt">Torna a Bolle / DDT</Link>
      </Button>

      <section className="rounded-[8px] border border-border bg-white p-8 text-sm text-black print:border-0 print:p-0">
        <div className="flex justify-between gap-6 border-b border-black pb-4">
          <div>
            <h2 className="text-xl font-bold">GiaFarm</h2>
            <p>{ddt.senderHeading ?? "Azienda agricola"}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold">DOCUMENTO DI TRASPORTO</p>
            <p>Numero {ddt.number}</p>
            <p>Data {formatDate(ddt.issuedOn)}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-[8px] border border-black p-3">
            <p className="font-bold">Destinatario</p>
            <p>{ddt.customer?.businessName ?? "Non indicato"}</p>
            <p>{ddt.customer?.address ?? ""}</p>
          </div>
          <div className="rounded-[8px] border border-black p-3">
            <p className="font-bold">Destinazione</p>
            <p>{ddt.destinationText || ddt.destination?.name || "-"}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <p><span className="font-bold">Causale:</span> {ddt.transportReason ?? "-"}</p>
          <p><span className="font-bold">Aspetto:</span> {ddt.packageAppearance ?? "-"}</p>
          <p><span className="font-bold">Colli:</span> {ddt.packageCount ?? "-"}</p>
          <p><span className="font-bold">Mezzo:</span> {ddt.transportedBy ?? "-"}</p>
        </div>

        <table className="mt-4 w-full border-collapse">
          <thead>
            <tr>
              <th className="border border-black p-2 text-left">Art.</th>
              <th className="border border-black p-2 text-left">Descrizione</th>
              <th className="border border-black p-2 text-left">Quantita</th>
              <th className="border border-black p-2 text-left">UM</th>
            </tr>
          </thead>
          <tbody>
            {ddt.rows.map((row, index) => (
              <tr key={row.id}>
                <td className="border border-black p-2">{index + 1}</td>
                <td className="border border-black p-2">
                  {row.description}
                  {row.productMaterial ? ` - ${row.productMaterial.name}` : ""}
                </td>
                <td className="border border-black p-2">{formatDecimal(row.quantity)}</td>
                <td className="border border-black p-2">{row.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <p><span className="font-bold">Data/ora trasporto:</span> {formatDateTime(ddt.transportStartsAt)}</p>
          <p><span className="font-bold">Firma conducente:</span> {ddt.driverSignature ?? ""}</p>
          <p><span className="font-bold">Firma destinatario:</span> {ddt.recipientSignature ?? ""}</p>
        </div>
      </section>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Movimenti di magazzino</h2>
        </CardHeader>
        <CardContent>
          {ddt.kind === "FREE_TEXT" ? (
            <p className="text-sm text-muted-foreground">
              Questo DDT non scarica il magazzino.
            </p>
          ) : (
            <div className="space-y-2">
              {ddt.rows.map((row) => (
                <p className="text-sm" key={row.id}>
                  {row.productMaterial?.name ?? row.description}: {formatDecimal(row.quantity)} {row.unit}
                  {row.warehouseMovements.length > 0 ? " scaricati" : " senza movimento"}
                </p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
