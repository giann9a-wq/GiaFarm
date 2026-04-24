import Link from "next/link";
import { notFound } from "next/navigation";
import { FinanceCostForm } from "@/app/(app)/finanza/cost-form";
import { FinanceNav } from "@/app/(app)/finanza/finance-nav";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { getFinanceCost } from "@/lib/finance/queries";

export default async function EditFinanceCostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cost = await getFinanceCost(id);
  if (!cost) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title="Modifica costo" subtitle={cost.description} />
      <FinanceNav />
      <Button asChild variant="secondary">
        <Link href={`/finanza/costi/${id}`}>Torna al dettaglio</Link>
      </Button>
      <FinanceCostForm costId={id} />
    </div>
  );
}
