import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { OperationForm } from "@/app/(app)/lavorazioni/operation-form";

export default async function NewOperationPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const error = Array.isArray(params.error) ? params.error[0] : params.error;
  const fieldGroupId = Array.isArray(params.fieldGroupId)
    ? params.fieldGroupId[0]
    : params.fieldGroupId;
  const fieldIdsParam = params.fieldIds;
  const fieldIds = Array.isArray(fieldIdsParam)
    ? fieldIdsParam
    : fieldIdsParam
      ? fieldIdsParam.split(",")
      : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nuova lavorazione"
        subtitle="Registra una lavorazione su gruppo, campo singolo o entrambi, mantenendo il legame con la campagna agricola."
      />
      <Button asChild variant="secondary">
        <Link href="/lavorazioni">Torna all&apos;elenco</Link>
      </Button>
      <OperationForm
        actionError={error}
        defaultFieldGroupId={fieldGroupId}
        defaultFieldIds={fieldIds}
      />
    </div>
  );
}
