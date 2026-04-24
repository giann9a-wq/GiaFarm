import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FinanceNav } from "@/app/(app)/finanza/finance-nav";
import { getFinanceBaseData, getFinanceDashboard } from "@/lib/finance/queries";
import { formatCurrency } from "@/lib/finance/format";

type FinanceDashboardPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function FinanceDashboardPage({
  searchParams,
}: FinanceDashboardPageProps) {
  const params = await searchParams;
  const filters = {
    campaignId: single(params.campaignId),
    fieldGroupId: single(params.fieldGroupId),
    from: single(params.from),
    to: single(params.to),
  };
  const [{ campaigns, fieldGroups }, dashboard] = await Promise.all([
    getFinanceBaseData(),
    getFinanceDashboard(filters),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finanza"
        subtitle="Controllo operativo di costi, ricavi e margini per campagna e gruppi di campi."
      />
      <FinanceNav />

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

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <p className="text-sm text-muted-foreground">Costi periodo</p>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {formatCurrency(dashboard.periodSummary.totalCosts)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <p className="text-sm text-muted-foreground">Ricavi periodo</p>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {formatCurrency(dashboard.periodSummary.totalRevenues)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <p className="text-sm text-muted-foreground">Margine periodo</p>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">
              {formatCurrency(dashboard.periodSummary.margin)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Margine per campagna</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboard.campaigns.map((campaign) => (
              <div
                className="rounded-[8px] border border-border p-3"
                key={campaign.id}
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="font-medium">{campaign.label}</p>
                  <p className="font-semibold">
                    {formatCurrency(campaign.margin)}
                  </p>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Costi {formatCurrency(campaign.costs)} � Ricavi{" "}
                  {formatCurrency(campaign.revenues)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold">Margine per gruppo</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboard.groups.map((group) => (
              <div
                className="rounded-[8px] border border-border p-3"
                key={group.id}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium">{group.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {group.campaign}
                    </p>
                  </div>
                  <p className="font-semibold">
                    {formatCurrency(group.margin)}
                  </p>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Costi {formatCurrency(group.costs)} � Ricavi{" "}
                  {formatCurrency(group.revenues)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
