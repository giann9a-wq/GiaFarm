import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { FieldGroupForm } from "@/app/(app)/lavorazioni/group-form";
import { deleteFieldGroupAction } from "@/app/(app)/lavorazioni/actions";
import { getFieldGroupsList } from "@/lib/operations/queries";
import { formatDate, formatDecimal } from "@/lib/operations/format";

type FieldGroupsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function FieldGroupsPage({ searchParams }: FieldGroupsPageProps) {
  const params = await searchParams;
  const mode = firstParam(params.mode);
  const selectedGroupId = firstParam(params.id);
  const groups = await getFieldGroupsList();
  const selectedGroup = selectedGroupId
    ? groups.find((group) => group.id === selectedGroupId)
    : undefined;
  const formMode =
    mode === "create" || mode === "edit" || mode === "duplicate" ? mode : undefined;
  const canShowForm = formMode === "create" || Boolean(formMode && selectedGroup);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gruppi campi"
        subtitle="Gruppi annuali per campagna e coltura. Lo stesso campo puo' appartenere a gruppi diversi nello stesso anno se i cicli sono distinti."
      />
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="secondary">
          <Link href="/lavorazioni">Torna alle lavorazioni</Link>
        </Button>
        <Button asChild>
          <Link href="/lavorazioni/gruppi?mode=create">Crea nuovo gruppo</Link>
        </Button>
      </div>

      {canShowForm ? (
        <FieldGroupForm
          mode={formMode}
          defaults={
            selectedGroup
              ? {
                  id: selectedGroup.id,
                  campaignId: selectedGroup.campaignId,
                  name: selectedGroup.name,
                  cropId: selectedGroup.cropId,
                  startsOn: selectedGroup.startsOn,
                  endsOn: selectedGroup.endsOn,
                  fieldIds: selectedGroup.memberships.map((membership) => membership.field.id),
                  notes: selectedGroup.notes
                }
              : undefined
          }
        />
      ) : formMode ? (
        <div className="rounded-[8px] border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          Gruppo non trovato. Torna all&apos;elenco e riprova.
        </div>
      ) : null}

      <div className="space-y-3">
        {groups.map((group) => {
          const totalHa = group.memberships.reduce((sum, membership) => {
            const latestUsage = membership.field.usageHistory
              .slice()
              .sort((a, b) => b.year - a.year)[0];
            return sum + (latestUsage ? Number(latestUsage.usedAreaSqm) / 10000 : 0);
          }, 0);

          return (
            <details className="rounded-[8px] border border-border bg-card" key={group.id}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5">
                <div>
                  <h2 className="text-lg font-semibold">{group.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {group.campaign.name} - {group.crop?.name ?? "Coltura non definita"}
                  </p>
                </div>
                <div className="flex items-center gap-5 text-sm">
                  <span>{formatDecimal(totalHa, 4)} ha</span>
                  <span>{group.memberships.length} campi</span>
                  <span className="font-semibold text-primary">Apri</span>
                </div>
              </summary>
              <div className="space-y-4 border-t border-border p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm">
                    Periodo: {group.startsOn ? formatDate(group.startsOn) : "n.d."} -{" "}
                    {group.endsOn ? formatDate(group.endsOn) : "n.d."}
                  </p>
                  <div className="flex gap-3">
                    <Button asChild>
                      <Link href={`/lavorazioni/nuova?fieldGroupId=${group.id}`}>
                        Nuova lavorazione
                      </Link>
                    </Button>
                    <Button asChild variant="secondary">
                      <Link href={`/lavorazioni/gruppi?mode=edit&id=${group.id}`}>
                        Modifica
                      </Link>
                    </Button>
                    <Button asChild variant="secondary">
                      <Link href={`/lavorazioni/gruppi?mode=duplicate&id=${group.id}`}>
                        Duplica
                      </Link>
                    </Button>
                    <form action={deleteFieldGroupAction.bind(null, group.id)}>
                      <Button type="submit" variant="secondary">
                        Elimina gruppo
                      </Button>
                    </form>
                  </div>
                </div>
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {group.memberships.map(({ field }) => {
                    const latestUsage = field.usageHistory
                      .slice()
                      .sort((a, b) => b.year - a.year)[0];

                    return (
                      <p className="rounded-[8px] border border-border p-3 text-sm" key={field.id}>
                        {field.municipality} Fg. {field.cadastralSheet} Map. {field.cadastralParcel}
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {latestUsage
                            ? `${formatDecimal(Number(latestUsage.usedAreaSqm) / 10000, 4)} ha`
                            : "Superficie n.d."}
                        </span>
                      </p>
                    );
                  })}
                </div>
              </div>
            </details>
          );
        })}
      </div>
    </div>
  );
}
