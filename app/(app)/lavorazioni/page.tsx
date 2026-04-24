import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import {
  getOperationsFiltersData,
  getOperationsList,
} from "@/lib/operations/queries";
import {
  formatCategory,
  formatDate,
  formatDecimal,
} from "@/lib/operations/format";

type OperationsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function OperationsPage({
  searchParams,
}: OperationsPageProps) {
  const params = await searchParams;
  const filters = {
    campaignId: single(params.campaignId),
    fieldGroupId: single(params.fieldGroupId),
    fieldId: single(params.fieldId),
    operationTypeId: single(params.operationTypeId),
    from: single(params.from),
    to: single(params.to),
  };
  const [{ campaigns, groups, fields, operationTypes }, operations] =
    await Promise.all([getOperationsFiltersData(), getOperationsList(filters)]);
  const activeCampaign =
    campaigns.find((campaign) => campaign.status === "ACTIVE") ?? campaigns[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lavorazioni"
        subtitle="Registro reale delle operazioni agricole per campagna, gruppi campi, colture e allegati."
      />

      <div className="flex flex-wrap justify-end gap-3">
        <Button asChild variant="secondary">
          <Link href="/lavorazioni/gruppi">Gestisci gruppi</Link>
        </Button>
        <Button asChild>
          <Link href="/lavorazioni/nuova">Nuova lavorazione</Link>
        </Button>
      </div>

      <form className="grid gap-4 rounded-[8px] border border-border bg-card p-5 lg:grid-cols-6">
        <label className="text-sm font-medium">
          Campagna
          <select
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={filters.campaignId ?? activeCampaign?.id ?? ""}
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
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Campo
          <select
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={filters.fieldId ?? ""}
            name="fieldId"
          >
            <option value="">Tutti</option>
            {fields.map((field) => (
              <option key={field.id} value={field.id}>
                {field.municipality} Fg. {field.cadastralSheet} Map.{" "}
                {field.cadastralParcel}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Tipologia
          <select
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={filters.operationTypeId ?? ""}
            name="operationTypeId"
          >
            <option value="">Tutte</option>
            {operationTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Da
          <input
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={filters.from ?? ""}
            name="from"
            type="date"
          />
        </label>
        <label className="text-sm font-medium">
          A
          <input
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={filters.to ?? ""}
            name="to"
            type="date"
          />
        </label>
        <div className="lg:col-span-6">
          <Button type="submit" variant="secondary">
            Filtra
          </Button>
        </div>
      </form>

      <div className="overflow-hidden rounded-[8px] border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] border-collapse text-left text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Data</th>
                <th className="px-4 py-3 font-semibold">Campagna</th>
                <th className="px-4 py-3 font-semibold">Gruppo</th>
                <th className="px-4 py-3 font-semibold">Tipo</th>
                <th className="px-4 py-3 font-semibold">Prodotto</th>
                <th className="px-4 py-3 font-semibold">Quantita&apos;</th>
                <th className="px-4 py-3 font-semibold">Superficie</th>
                <th className="px-4 py-3 font-semibold">Allegati</th>
                <th className="px-4 py-3 font-semibold">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {operations.map((operation) => (
                <tr className="hover:bg-muted/60" key={operation.id}>
                  <td className="px-4 py-3">
                    {formatDate(operation.performedOn)}
                  </td>
                  <td className="px-4 py-3">{operation.campaign.name}</td>
                  <td className="px-4 py-3">
                    {operation.fieldGroups
                      .map(({ fieldGroup }) => fieldGroup.name)
                      .join(", ") || "-"}
                  </td>
                  <td className="px-4 py-3">
                    {formatCategory(operation.operationType.category)} -{" "}
                    {operation.operationType.name}
                  </td>
                  <td className="px-4 py-3">
                    {operation.materialUsages.length > 0
                      ? operation.materialUsages
                          .map((usage) => usage.productMaterial.name)
                          .join(", ")
                      : operation.productMaterial?.name ?? "-"}
                  </td>
                  <td className="px-4 py-3">
                    {operation.materialUsages.length > 0
                      ? operation.materialUsages
                          .map(
                            (usage) =>
                              `${formatDecimal(usage.quantity)} ${usage.unit}`
                          )
                          .join(" · ")
                      : `${formatDecimal(operation.quantity)} ${operation.quantityUnit ?? ""}`}
                  </td>
                  <td className="px-4 py-3">
                    {formatDecimal(operation.treatedAreaHa)} ha
                  </td>
                  <td className="px-4 py-3">{operation.attachments.length}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button asChild variant="secondary">
                        <Link href={`/lavorazioni/${operation.id}`}>
                          Dettaglio
                        </Link>
                      </Button>
                      <Button asChild variant="secondary">
                        <Link href={`/lavorazioni/${operation.id}/modifica`}>
                          Modifica
                        </Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {operations.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-8 text-center text-muted-foreground"
                    colSpan={9}
                  >
                    Nessuna lavorazione trovata.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
