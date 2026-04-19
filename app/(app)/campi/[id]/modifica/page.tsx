import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { FieldForm } from "@/app/(app)/campi/field-form";
import { getFieldDetail } from "@/lib/fields/queries";

export default async function EditFieldPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const field = await getFieldDetail(id);
  if (!field) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Modifica campo"
        subtitle="Aggiorna solo i dati anagrafici stabili. Superficie utilizzata e PAC restano gestiti nello storico."
      />
      <Button asChild variant="secondary">
        <Link href={`/campi/${field.id}`}>Torna al dettaglio</Link>
      </Button>
      <FieldForm field={field} />
    </div>
  );
}
