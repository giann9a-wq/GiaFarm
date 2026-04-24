import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentPreviewButton } from "@/components/app/document-preview-button";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FinanceNav } from "@/app/(app)/finanza/finance-nav";
import { formatCurrency, formatFinanceDate } from "@/lib/finance/format";
import { getFinanceCost } from "@/lib/finance/queries";

export default async function FinanceCostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cost = await getFinanceCost(id);
  if (!cost) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          cost.documentNumber
            ? `Costo ${cost.documentNumber}`
            : "Dettaglio costo"
        }
        subtitle={cost.description}
      />
      <FinanceNav />
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="secondary">
          <Link href="/finanza/costi">Torna ai costi</Link>
        </Button>
        <Button asChild>
          <Link href={`/finanza/costi/${cost.id}/modifica`}>
            Modifica costo
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Dati documento</h2>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 md:grid-cols-3">
            <Detail label="Data" value={formatFinanceDate(cost.occurredOn)} />
            <Detail
              label="Fornitore"
              value={cost.supplier?.businessName ?? "-"}
            />
            <Detail label="Campagna" value={cost.campaign?.name ?? "-"} />
            <Detail label="Categoria" value={cost.category} />
            <Detail
              label="Imponibile"
              value={formatCurrency(cost.taxableAmount)}
            />
            <Detail label="IVA" value={formatCurrency(cost.vatAmount)} />
            <Detail label="Totale" value={formatCurrency(cost.amount)} />
            <div className="md:col-span-3">
              <Detail label="Descrizione" value={cost.description} />
            </div>
          </dl>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Allocazioni</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {cost.allocations.map((allocation) => (
              <div
                className="rounded-[8px] border border-border p-3"
                key={allocation.id}
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="font-medium">{allocation.fieldGroup.name}</p>
                  <p className="font-semibold">
                    {formatCurrency(allocation.amount)}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  {allocation.fieldGroup.campaign.name}
                  {allocation.fieldGroup.crop
                    ? ` · ${allocation.fieldGroup.crop.name}`
                    : ""}
                </p>
              </div>
            ))}
            {cost.allocations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nessuna allocazione registrata.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold">Documento PDF</h2>
          </CardHeader>
          <CardContent>
            {cost.driveFile ? (
              <DocumentPreviewButton
                href={`/api/files/${cost.driveFile.id}`}
                title={cost.driveFile.name}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Nessun documento allegato.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1">{value}</dd>
    </div>
  );
}
