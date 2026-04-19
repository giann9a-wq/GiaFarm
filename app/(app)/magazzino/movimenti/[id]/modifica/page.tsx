import Link from "next/link";
import { RoleCode, WarehouseMovementType } from "@prisma/client";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { updateWarehouseAdjustmentAction } from "@/app/(app)/magazzino/actions";
import { requireRole } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";
import { formatDecimal } from "@/lib/warehouse/format";

export default async function EditWarehouseAdjustmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(RoleCode.ADMIN);
  const { id } = await params;
  const movement = await prisma.warehouseMovement.findUnique({
    where: { id },
    include: { adjustment: true, productMaterial: true },
  });
  if (!movement || movement.source !== "RETTIFICA_ADMIN") notFound();

  const signedQuantity =
    movement.movementType === WarehouseMovementType.OUT
      ? -Number(movement.quantity)
      : Number(movement.quantity);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Modifica rettifica magazzino"
        subtitle={`${movement.productMaterial.name} - valore attuale ${formatDecimal(signedQuantity)} ${movement.unit}`}
      />
      <Button asChild variant="secondary">
        <Link href={`/magazzino/${movement.productMaterialId}`}>
          Torna al dettaglio
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Dati rettifica</h2>
        </CardHeader>
        <CardContent>
          <form
            action={updateWarehouseAdjustmentAction.bind(null, movement.id)}
            className="space-y-4"
          >
            <label className="block text-sm font-medium">
              Data
              <input
                className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
                defaultValue={movement.movedOn.toISOString().slice(0, 10)}
                name="movedOn"
                required
                type="date"
              />
            </label>
            <label className="block text-sm font-medium">
              Quantita (+ carico, - scarico)
              <input
                className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
                defaultValue={String(signedQuantity).replace(".", ",")}
                inputMode="decimal"
                name="quantity"
                required
              />
            </label>
            <label className="block text-sm font-medium">
              Unita
              <input
                className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
                defaultValue={movement.unit}
                name="unit"
                required
              />
            </label>
            <label className="block text-sm font-medium">
              Causale obbligatoria
              <textarea
                className="focus-ring mt-2 min-h-24 w-full rounded-[8px] border border-input bg-background px-3 py-2"
                defaultValue={
                  movement.adjustment?.reason ?? movement.note ?? ""
                }
                name="reason"
                required
              />
            </label>
            <Button type="submit">Salva rettifica</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
