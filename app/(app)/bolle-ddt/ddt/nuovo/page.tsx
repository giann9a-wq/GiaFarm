import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { OutboundDdtForm } from "@/app/(app)/bolle-ddt/ddt-form";

export default function NewOutboundDdtPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Nuovo DDT"
        subtitle="Emetti un DDT da magazzino oppure un DDT free text per raccolto o trasporti non inventariati."
      />
      <Button asChild variant="secondary">
        <Link href="/bolle-ddt">Torna a Bolle / DDT</Link>
      </Button>
      <OutboundDdtForm />
    </div>
  );
}
