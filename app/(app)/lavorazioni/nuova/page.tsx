import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { OperationForm } from "@/app/(app)/lavorazioni/operation-form";

export default function NewOperationPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Nuova lavorazione"
        subtitle="Registra una lavorazione su gruppo, campo singolo o entrambi, mantenendo il legame con la campagna agricola."
      />
      <Button asChild variant="secondary">
        <Link href="/lavorazioni">Torna all&apos;elenco</Link>
      </Button>
      <OperationForm />
    </div>
  );
}
