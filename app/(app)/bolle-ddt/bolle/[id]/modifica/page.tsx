import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { InboundDeliveryForm } from "@/app/(app)/bolle-ddt/inbound-form";
import { getInboundDeliveryNote } from "@/lib/warehouse/queries";

export default async function EditInboundDeliveryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const note = await getInboundDeliveryNote(id);
  if (!note) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Modifica bolla ${note.number}`}
        subtitle="Aggiorna dati documento, righe e movimenti di magazzino collegati."
      />
      <Button asChild variant="secondary">
        <Link href={`/bolle-ddt/bolle/${id}`}>Torna al dettaglio</Link>
      </Button>
      <InboundDeliveryForm noteId={id} />
    </div>
  );
}
