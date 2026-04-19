import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { FieldForm } from "@/app/(app)/campi/field-form";

export default function NewFieldPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Nuovo campo"
        subtitle={"Crea l'anagrafica stabile del terreno. Superficie utilizzata e PAC si registrano dal dettaglio come dati storici."}
      />
      <Button asChild variant="secondary">
        <Link href="/campi">Torna all&apos;elenco</Link>
      </Button>
      <FieldForm />
    </div>
  );
}
