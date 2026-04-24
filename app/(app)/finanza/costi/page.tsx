import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FinanceNav } from "@/app/(app)/finanza/finance-nav";
import { formatCurrency, formatFinanceDate } from "@/lib/finance/format";
import { getFinanceBaseData, getFinanceCosts } from "@/lib/finance/queries";

type CostListPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function FinanceCostsPage({
  searchParams,
}: CostListPageProps) {
  const params = await searchParams;
  const filters = {
    campaignId: single(params.campaignId),
    fieldGroupId: single(params.fieldGroupId),
    from: single(params.from),
    to: single(params.to),
  };
  const [{ campaigns, fieldGroups }, costs] = await Promise.all([
    getFinanceBaseData(),
    getFinanceCosts(filters),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finanza · Costi"
        subtitle="Registro costi e fatture ricevute con allocazioni a campagna e gruppi."
      />
      <FinanceNav />
      <div className="flex justify-end">
        <Button asChild>
          <Link href="/finanza/costi/nuovo">Nuovo costo</Link>
        </Button>
      </div>

      <form className="grid gap-4 rounded-[8px] border border-border bg-card p-5 lg:grid-cols-4">
        <label className="text-sm font-medium">
          Campagna
          <select
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={filters.campaignId ?? ""}
            name="campaignId"
          >
            <option value="">Tutte</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Gruppo
          <select
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={filters.fieldGroupId ?? ""}
            name="fieldGroupId"
          >
            <option value="">Tutti</option>
            {fieldGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.campaign.name} - {group.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Dal
          <input
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={filters.from ?? ""}
            name="from"
            type="date"
          />
        </label>
        <label className="text-sm font-medium">
          Al
          <input
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={filters.to ?? ""}
            name="to"
            type="date"
          />
        </label>
      </form>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Elenco costi</h2>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Data</th>
                <th className="px-4 py-3 text-left">Numero</th>
                <th className="px-4 py-3 text-left">Fornitore</th>
                <th className="px-4 py-3 text-left">Descrizione</th>
                <th className="px-4 py-3 text-left">Importo</th>
                <th className="px-4 py-3 text-left">Campagna</th>
                <th className="px-4 py-3 text-left">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {costs.map((cost) => (
                <tr key={cost.id}>
                  <td className="px-4 py-3">
                    {formatFinanceDate(cost.occurredOn)}
                  </td>
                  <td className="px-4 py-3">{cost.documentNumber ?? "-"}</td>
                  <td className="px-4 py-3">
                    {cost.supplier?.businessName ?? "-"}
                  </td>
                  <td className="px-4 py-3">{cost.description}</td>
                  <td className="px-4 py-3">{formatCurrency(cost.amount)}</td>
                  <td className="px-4 py-3">{cost.campaign?.name ?? "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button asChild variant="secondary">
                        <Link href={`/finanza/costi/${cost.id}`}>
                          Dettaglio
                        </Link>
                      </Button>
                      <Button asChild variant="secondary">
                        <Link href={`/finanza/costi/${cost.id}/modifica`}>
                          Modifica
                        </Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {costs.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-muted-foreground" colSpan={7}>
                    Nessun costo registrato.
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
