import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { OutboundDdtForm } from "@/app/(app)/bolle-ddt/ddt-form";
import { getOutboundDdt } from "@/lib/warehouse/queries";

export default async function EditOutboundDdtPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ddt = await getOutboundDdt(id);
  if (!ddt) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Modifica DDT ${ddt.number}`}
        subtitle="Aggiorna documento, destinatario, righe e movimenti di magazzino collegati."
      />
      <Button asChild variant="secondary">
        <Link href={`/bolle-ddt/ddt/${id}`}>Torna al dettaglio</Link>
      </Button>
      <OutboundDdtForm ddtId={id} />
    </div>
  );
}
