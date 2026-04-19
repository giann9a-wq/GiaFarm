import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { InboundDeliveryForm } from "@/app/(app)/bolle-ddt/inbound-form";

export default function NewInboundDeliveryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Nuova bolla in ingresso"
        subtitle="Registra materiali acquistati e genera automaticamente movimenti di magazzino in aumento."
      />
      <Button asChild variant="secondary">
        <Link href="/bolle-ddt">Torna a Bolle / DDT</Link>
      </Button>
      <InboundDeliveryForm />
    </div>
  );
}
