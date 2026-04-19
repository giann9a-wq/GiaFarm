import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { OperationForm } from "@/app/(app)/lavorazioni/operation-form";
import { getOperationDetail } from "@/lib/operations/queries";

export default async function EditOperationPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const operation = await getOperationDetail(id);
  if (!operation) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Modifica lavorazione"
        subtitle="Aggiorna la lavorazione mantenendo campagna, gruppo e campi coerenti con le superfici coltivate."
      />
      <Button asChild variant="secondary">
        <Link href={`/lavorazioni/${id}`}>Torna al dettaglio</Link>
      </Button>
      <OperationForm operationId={id} />
    </div>
  );
}
