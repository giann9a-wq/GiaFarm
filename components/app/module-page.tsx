import { DetailList } from "@/components/ui/detail-list";
import { FormShell } from "@/components/ui/form-shell";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/app/page-header";

type ModulePageProps = {
  title: string;
  subtitle: string;
  primaryAction: string;
  rows: readonly (readonly string[])[];
  detail: readonly (readonly [string, string])[];
};

export function ModulePage({
  title,
  subtitle,
  primaryAction,
  rows,
  detail
}: ModulePageProps) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} subtitle={subtitle} actionLabel={primaryAction} />
      <DataTable
        columns={["Riferimento", "Dato 1", "Dato 2", "Dato 3", "Stato"]}
        rows={rows}
      />
      <DetailList items={detail} />
      <FormShell
        title={`Form base ${title}`}
        description="Componente riusabile pronto per essere sostituito da validazioni Zod e server action dedicate."
      />
    </div>
  );
}
