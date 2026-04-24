import Link from "next/link";
import { FinanceNav } from "@/app/(app)/finanza/finance-nav";
import { FinanceRevenueForm } from "@/app/(app)/finanza/revenue-form";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";

export default function NewFinanceRevenuePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Nuovo ricavo"
        subtitle="Registra un ricavo o una fattura emessa e ripartiscilo sui gruppi di campi."
      />
      <FinanceNav />
      <Button asChild variant="secondary">
        <Link href="/finanza/ricavi">Torna ai ricavi</Link>
      </Button>
      <FinanceRevenueForm />
    </div>
  );
}
