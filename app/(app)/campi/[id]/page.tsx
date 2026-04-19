import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { HistoryForms } from "@/app/(app)/campi/history-forms";
import { getFieldDetail } from "@/lib/fields/queries";
import { formatPac, formatSqm } from "@/lib/fields/format";

export default async function FieldDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const field = await getFieldDetail(id);
  if (!field) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${field.municipality} - Fg. ${field.cadastralSheet} Map. ${field.cadastralParcel}`}
        subtitle="Dettaglio anagrafico con storico superficie utilizzata e PAC."
      />

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="secondary">
          <Link href="/campi">Torna all&apos;elenco</Link>
        </Button>
        <Button asChild>
          <Link href={`/campi/${field.id}/modifica`}>Modifica anagrafica</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Anagrafica</h2>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 md:grid-cols-3">
            <div>
              <dt className="text-xs font-semibold uppercase text-muted-foreground">Comune</dt>
              <dd className="mt-1">{field.municipality}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-muted-foreground">Foglio</dt>
              <dd className="mt-1">{field.cadastralSheet}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-muted-foreground">Mappale</dt>
              <dd className="mt-1">{field.cadastralParcel}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-muted-foreground">Alias</dt>
              <dd className="mt-1">{field.commonName || "-"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-muted-foreground">Catastale mq</dt>
              <dd className="mt-1">{formatSqm(field.cadastralAreaSqm)}</dd>
            </div>
            <div className="md:col-span-3">
              <dt className="text-xs font-semibold uppercase text-muted-foreground">Note</dt>
              <dd className="mt-1">{field.notes || "-"}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Storico superficie utilizzata</h2>
          </CardHeader>
          <CardContent>
            <HistoryTable
              rows={field.usageHistory.map((item) => [
                String(item.year),
                `${formatSqm(item.usedAreaSqm)} mq`,
                item.note || "-",
                item.updatedAt.toLocaleString("it-IT")
              ])}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Storico PAC</h2>
          </CardHeader>
          <CardContent>
            <HistoryTable
              rows={field.pacHistory.map((item) => [
                String(item.year),
                formatPac(item.included),
                item.note || "-",
                item.updatedAt.toLocaleString("it-IT")
              ])}
            />
          </CardContent>
        </Card>
      </div>

      <HistoryForms fieldId={field.id} />
    </div>
  );
}

function HistoryTable({ rows }: { rows: string[][] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">Nessun dato storico.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="text-xs uppercase text-muted-foreground">
          <tr>
            <th className="py-2 font-semibold">Anno</th>
            <th className="py-2 font-semibold">Valore</th>
            <th className="py-2 font-semibold">Nota</th>
            <th className="py-2 font-semibold">Aggiornato</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={row.join("-")}>
              {row.map((cell) => (
                <td className="py-3 pr-4 align-top" key={cell}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
