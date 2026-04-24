import Link from "next/link";
import { FinanceCostForm } from "@/app/(app)/finanza/cost-form";
import { FinanceNav } from "@/app/(app)/finanza/finance-nav";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";

export default function NewFinanceCostPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Nuovo costo"
        subtitle="Registra un costo o una fattura ricevuta e ripartiscilo sui gruppi di campi."
      />
      <FinanceNav />
      <Button asChild variant="secondary">
        <Link href="/finanza/costi">Torna ai costi</Link>
      </Button>
      <FinanceCostForm />
    </div>
  );
}
