import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { getFieldsForList } from "@/lib/fields/queries";
import { formatPac, formatSqm } from "@/lib/fields/format";

export default async function FieldsPage() {
  const fields = await getFieldsForList();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campi"
        subtitle="Anagrafica terreni con superficie utilizzata e stato PAC storicizzati per anno."
      />

      <div className="flex justify-end">
        <Button asChild>
          <Link href="/campi/nuovo">Nuovo campo</Link>
        </Button>
      </div>

      <div className="overflow-hidden rounded-[8px] border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-collapse text-left text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">Comune</th>
                <th className="px-4 py-3 font-semibold">Foglio</th>
                <th className="px-4 py-3 font-semibold">Mappale</th>
                <th className="px-4 py-3 font-semibold">Alias</th>
                <th className="px-4 py-3 font-semibold">Catastale mq</th>
                <th className="px-4 py-3 font-semibold">Ultima superficie mq</th>
                <th className="px-4 py-3 font-semibold">Ultimo PAC</th>
                <th className="px-4 py-3 font-semibold">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {fields.map((field) => {
                const latestUsage = field.usageHistory[0];
                const latestPac = field.pacHistory[0];

                return (
                  <tr className="hover:bg-muted/60" key={field.id}>
                    <td className="px-4 py-3 font-medium">{field.municipality}</td>
                    <td className="px-4 py-3">{field.cadastralSheet}</td>
                    <td className="px-4 py-3">{field.cadastralParcel}</td>
                    <td className="px-4 py-3">{field.commonName || "-"}</td>
                    <td className="px-4 py-3">{formatSqm(field.cadastralAreaSqm)}</td>
                    <td className="px-4 py-3">
                      {latestUsage
                        ? `${formatSqm(latestUsage.usedAreaSqm)} (${latestUsage.year})`
                        : "n.d."}
                    </td>
                    <td className="px-4 py-3">
                      {latestPac
                        ? `${formatPac(latestPac.included)} (${latestPac.year})`
                        : "n.d."}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button asChild variant="secondary">
                          <Link href={`/campi/${field.id}`}>Dettaglio</Link>
                        </Button>
                        <Button asChild variant="ghost">
                          <Link href={`/campi/${field.id}/modifica`}>Modifica</Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Eliminazione non attiva in questa fase: verra&apos; gestita con soft delete per
        non perdere relazioni e storico.
      </p>
    </div>
  );
}
