import Link from "next/link";
import { notFound } from "next/navigation";
import { DocumentPreviewButton } from "@/components/app/document-preview-button";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FinanceNav } from "@/app/(app)/finanza/finance-nav";
import { formatCurrency, formatFinanceDate } from "@/lib/finance/format";
import { getFinanceRevenue } from "@/lib/finance/queries";

export default async function FinanceRevenueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const revenue = await getFinanceRevenue(id);
  if (!revenue) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          revenue.documentNumber
            ? `Ricavo ${revenue.documentNumber}`
            : "Dettaglio ricavo"
        }
        subtitle={revenue.description}
      />
      <FinanceNav />
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="secondary">
          <Link href="/finanza/ricavi">Torna ai ricavi</Link>
        </Button>
        <Button asChild>
          <Link href={`/finanza/ricavi/${revenue.id}/modifica`}>
            Modifica ricavo
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Dati documento</h2>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 md:grid-cols-3">
            <Detail
              label="Data"
              value={formatFinanceDate(revenue.occurredOn)}
            />
            <Detail
              label="Cliente"
              value={revenue.customer?.businessName ?? "-"}
            />
            <Detail label="Campagna" value={revenue.campaign?.name ?? "-"} />
            <Detail label="Categoria" value={revenue.category} />
            <Detail
              label="Imponibile"
              value={formatCurrency(revenue.taxableAmount)}
            />
            <Detail label="IVA" value={formatCurrency(revenue.vatAmount)} />
            <Detail label="Totale" value={formatCurrency(revenue.amount)} />
            <div className="md:col-span-3">
              <Detail label="Descrizione" value={revenue.description} />
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
            {revenue.allocations.map((allocation) => (
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
            {revenue.allocations.length === 0 ? (
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
            {revenue.driveFile ? (
              <DocumentPreviewButton
                href={`/api/files/${revenue.driveFile.id}`}
                title={revenue.driveFile.name}
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
