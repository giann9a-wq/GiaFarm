import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/app/print-button";
import { Button } from "@/components/ui/button";
import { getOperationDetail } from "@/lib/operations/queries";
import { formatCategory, formatDate, formatDecimal } from "@/lib/operations/format";

export default async function OperationSheetPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const operation = await getOperationDetail(id);
  if (!operation) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 print:hidden">
        <Button asChild variant="secondary">
          <Link href={`/lavorazioni/${id}`}>Torna alla lavorazione</Link>
        </Button>
        <PrintButton />
      </div>

      <section className="rounded-[8px] border border-border bg-white p-8 text-sm text-black">
        <div className="border-b border-black pb-4">
          <h1 className="text-2xl font-semibold">Scheda trattamento / lavorazione</h1>
          <p className="mt-2">
            {formatDate(operation.performedOn)} · {operation.campaign.name}
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Info
            label="Tipologia"
            value={`${formatCategory(operation.operationType.category)} - ${operation.operationType.name}`}
          />
          <Info label="Motivo trattamento" value={operation.treatmentReason ?? "-"} />
          <Info
            label="Gruppo"
            value={operation.fieldGroups.map(({ fieldGroup }) => fieldGroup.name).join(", ") || "-"}
          />
          <Info
            label="Superficie trattata"
            value={`${formatDecimal(operation.treatedAreaHa)} ha`}
          />
        </div>

        <div className="mt-6">
          <h2 className="font-semibold">Prodotti utilizzati</h2>
          <table className="mt-3 w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-black p-2 text-left">Prodotto</th>
                <th className="border border-black p-2 text-left">Quantità</th>
                <th className="border border-black p-2 text-left">Nota</th>
              </tr>
            </thead>
            <tbody>
              {operation.materialUsages.length > 0 ? (
                operation.materialUsages.map((usage) => (
                  <tr key={usage.id}>
                    <td className="border border-black p-2">{usage.productMaterial.name}</td>
                    <td className="border border-black p-2">
                      {formatDecimal(usage.quantity)} {usage.unit}
                    </td>
                    <td className="border border-black p-2">{usage.note ?? "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="border border-black p-2" colSpan={3}>
                    Nessun prodotto registrato.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6">
          <h2 className="font-semibold">Campi coinvolti</h2>
          <div className="mt-2 space-y-1">
            {[...operation.fields.map(({ field }) => field)].map((field) => (
              <p key={field.id}>
                {field.municipality} Fg. {field.cadastralSheet} Map. {field.cadastralParcel}
              </p>
            ))}
            {operation.fields.length === 0 ? (
              <p>-</p>
            ) : null}
          </div>
        </div>

        <div className="mt-6">
          <h2 className="font-semibold">Note</h2>
          <p className="mt-2 whitespace-pre-wrap">{operation.notes ?? "-"}</p>
        </div>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase">{label}</p>
      <p className="mt-1">{value}</p>
    </div>
  );
}
