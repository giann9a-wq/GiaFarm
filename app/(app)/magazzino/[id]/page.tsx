import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { createWarehouseAdjustmentAction } from "@/app/(app)/magazzino/actions";
import {
  getWarehouseProductDetail,
  signedMovementQuantity,
} from "@/lib/warehouse/queries";
import {
  formatDate,
  formatDecimal,
  formatMovementSource,
  formatMovementType,
} from "@/lib/warehouse/format";

export default async function WarehouseProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getWarehouseProductDetail(id);
  if (!product) notFound();
  const total = product.warehouseBalances.reduce(
    (sum, balance) => sum + Number(balance.quantity),
    0,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={product.name}
        subtitle={`Giacenza attuale: ${formatDecimal(total)} ${product.unit}`}
      />
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="secondary">
          <Link href="/magazzino">Torna al magazzino</Link>
        </Button>
        <Button asChild>
          <Link href={`/magazzino/${product.id}/modifica`}>
            Modifica materiale
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <h2 className="font-semibold">Storico movimenti</h2>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Data</th>
                  <th className="px-4 py-3 text-left">Tipo</th>
                  <th className="px-4 py-3 text-left">Origine</th>
                  <th className="px-4 py-3 text-left">Quantita</th>
                  <th className="px-4 py-3 text-left">Lotto</th>
                  <th className="px-4 py-3 text-left">Nota</th>
                  <th className="px-4 py-3 text-left">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {product.warehouseMovements.map((movement) => (
                  <tr key={movement.id}>
                    <td className="px-4 py-3">
                      {formatDate(movement.movedOn)}
                    </td>
                    <td className="px-4 py-3">
                      {formatMovementType(movement.movementType)}
                    </td>
                    <td className="px-4 py-3">
                      {formatMovementSource(movement.source)}
                    </td>
                    <td className="px-4 py-3">
                      {formatDecimal(signedMovementQuantity(movement))}{" "}
                      {movement.unit}
                    </td>
                    <td className="px-4 py-3">{movement.lot ?? "-"}</td>
                    <td className="px-4 py-3">
                      {movement.note ?? movement.adjustment?.reason ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      {movement.source === "RETTIFICA_ADMIN" ? (
                        <Button asChild variant="secondary">
                          <Link
                            href={`/magazzino/movimenti/${movement.id}/modifica`}
                          >
                            Modifica
                          </Link>
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">Derivato</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold">Rettifica admin</h2>
          </CardHeader>
          <CardContent>
            <form
              action={createWarehouseAdjustmentAction}
              className="space-y-4"
            >
              <input
                name="productMaterialId"
                type="hidden"
                value={product.id}
              />
              <label className="block text-sm font-medium">
                Data
                <input
                  className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
                  name="movedOn"
                  required
                  type="date"
                />
              </label>
              <label className="block text-sm font-medium">
                Quantita (+ carico, - scarico)
                <input
                  className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
                  inputMode="decimal"
                  name="quantity"
                  required
                />
              </label>
              <label className="block text-sm font-medium">
                Unita
                <input
                  className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
                  name="unit"
                  defaultValue={product.unit}
                  required
                />
              </label>
              <label className="block text-sm font-medium">
                Causale obbligatoria
                <textarea
                  className="focus-ring mt-2 min-h-24 w-full rounded-[8px] border border-input bg-background px-3 py-2"
                  name="reason"
                  required
                />
              </label>
              <Button type="submit">Registra rettifica</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
