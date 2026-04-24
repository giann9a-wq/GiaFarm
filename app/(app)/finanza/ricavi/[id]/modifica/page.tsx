import Link from "next/link";
import { notFound } from "next/navigation";
import { FinanceNav } from "@/app/(app)/finanza/finance-nav";
import { FinanceRevenueForm } from "@/app/(app)/finanza/revenue-form";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { getFinanceRevenue } from "@/lib/finance/queries";

export default async function EditFinanceRevenuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const revenue = await getFinanceRevenue(id);
  if (!revenue) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title="Modifica ricavo" subtitle={revenue.description} />
      <FinanceNav />
      <Button asChild variant="secondary">
        <Link href={`/finanza/ricavi/${id}`}>Torna al dettaglio</Link>
      </Button>
      <FinanceRevenueForm revenueId={id} />
    </div>
  );
}
