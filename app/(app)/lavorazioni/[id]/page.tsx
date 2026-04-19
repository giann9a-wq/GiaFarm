import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getOperationDetail } from "@/lib/operations/queries";
import { formatCategory, formatDate, formatDecimal } from "@/lib/operations/format";

export default async function OperationDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const operation = await getOperationDetail(id);
  if (!operation) notFound();

  const groupFields = operation.fieldGroups.flatMap(({ fieldGroup }) =>
    fieldGroup.memberships.map(({ field }) => field)
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${formatDate(operation.performedOn)} - ${operation.operationType.name}`}
        subtitle="Dettaglio completo della lavorazione e dei documenti collegati."
      />
      <Button asChild variant="secondary">
        <Link href="/lavorazioni">Torna all&apos;elenco</Link>
      </Button>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Dati lavorazione</h2>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 md:grid-cols-3">
            <Detail label="Campagna" value={operation.campaign.name} />
            <Detail
              label="Tipologia"
              value={`${formatCategory(operation.operationType.category)} - ${operation.operationType.name}`}
            />
            <Detail
              label="Prodotto"
              value={operation.productMaterial?.name ?? "-"}
            />
            <Detail
              label="Quantita'"
              value={`${formatDecimal(operation.quantity)} ${operation.quantityUnit ?? ""}`}
            />
            <Detail
              label="Superficie"
              value={`${formatDecimal(operation.treatedAreaHa)} ha`}
            />
            <Detail label="Motivo" value={operation.treatmentReason ?? "-"} />
            <div className="md:col-span-3">
              <Detail label="Note" value={operation.notes ?? "-"} />
            </div>
          </dl>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Gruppi</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {operation.fieldGroups.map(({ fieldGroup }) => (
              <div className="rounded-[8px] border border-border p-3" key={fieldGroup.id}>
                <p className="font-medium">{fieldGroup.name}</p>
                <p className="text-sm text-muted-foreground">
                  {fieldGroup.crop?.name ?? "Coltura non definita"} · {fieldGroup.memberships.length} campi
                </p>
              </div>
            ))}
            {operation.fieldGroups.length === 0 ? <p className="text-sm text-muted-foreground">Nessun gruppo.</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Campi coinvolti</h2>
          </CardHeader>
          <CardContent className="space-y-2">
            {[...operation.fields.map(({ field }) => field), ...groupFields].map((field) => (
              <p className="text-sm" key={`${field.id}-${field.cadastralParcel}`}>
                {field.municipality} Fg. {field.cadastralSheet} Map. {field.cadastralParcel}
              </p>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Allegati PDF</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          {operation.attachments.map((attachment) => (
            <div className="flex items-center justify-between gap-4 rounded-[8px] border border-border p-3" key={attachment.id}>
              <div>
                <p className="font-medium">{attachment.label || attachment.driveFile.name}</p>
                <p className="text-sm text-muted-foreground">{attachment.driveFile.name}</p>
              </div>
              {attachment.driveFile.webViewLink ? (
                <Button asChild variant="secondary">
                  <Link href={attachment.driveFile.webViewLink} target="_blank">
                    Apri
                  </Link>
                </Button>
              ) : null}
            </div>
          ))}
          {operation.attachments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessun allegato collegato.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase text-muted-foreground">{label}</dt>
      <dd className="mt-1">{value}</dd>
    </div>
  );
}
