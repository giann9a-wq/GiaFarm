import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FieldGroupForm } from "@/app/(app)/lavorazioni/group-form";
import { getFieldGroupsList } from "@/lib/operations/queries";
import { formatDate, formatDecimal } from "@/lib/operations/format";

export default async function FieldGroupsPage() {
  const groups = await getFieldGroupsList();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gruppi campi"
        subtitle="Gruppi annuali per campagna e coltura. Lo stesso campo puo' appartenere a gruppi diversi nello stesso anno se i cicli sono distinti."
      />
      <Button asChild variant="secondary">
        <Link href="/lavorazioni">Torna alle lavorazioni</Link>
      </Button>

      <FieldGroupForm />

      <div className="grid gap-4 xl:grid-cols-2">
        {groups.map((group) => {
          const totalHa = group.memberships.reduce((sum, membership) => {
            const latestUsage = membership.field.usageHistory
              .slice()
              .sort((a, b) => b.year - a.year)[0];
            return sum + (latestUsage ? Number(latestUsage.usedAreaSqm) / 10000 : 0);
          }, 0);

          return (
            <Card key={group.id}>
              <CardHeader>
                <h2 className="text-lg font-semibold">{group.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {group.campaign.name} · {group.crop?.name ?? "Coltura non definita"}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">
                  Periodo: {group.startsOn ? formatDate(group.startsOn) : "n.d."} -{" "}
                  {group.endsOn ? formatDate(group.endsOn) : "n.d."}
                </p>
                <p className="text-sm">Superficie gruppo stimata: {formatDecimal(totalHa, 4)} ha</p>
                <div className="space-y-1">
                  {group.memberships.map(({ field }) => (
                    <p className="text-sm" key={field.id}>
                      {field.municipality} Fg. {field.cadastralSheet} Map. {field.cadastralParcel}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
