import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  getWarehouseOverview,
  signedMovementQuantity,
} from "@/lib/warehouse/queries";
import {
  formatDate,
  formatDecimal,
  formatMovementSource,
  formatMovementType,
} from "@/lib/warehouse/format";

export default async function WarehousePage() {
  const { products, movements } = await getWarehouseOverview();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Magazzino"
        subtitle="Giacenze calcolate da bolle, lavorazioni, DDT e rettifiche admin."
      />

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Giacenze materiali</h2>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Materiale</th>
                <th className="px-4 py-3 text-left">Categoria</th>
                <th className="px-4 py-3 text-left">Giacenza</th>
                <th className="px-4 py-3 text-left">Lotti</th>
                <th className="px-4 py-3 text-left">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((product) => {
                const total = product.warehouseBalances.reduce(
                  (sum, balance) => sum + Number(balance.quantity),
                  0,
                );
                return (
                  <tr key={product.id}>
                    <td className="px-4 py-3 font-medium">{product.name}</td>
                    <td className="px-4 py-3">{product.category}</td>
                    <td className="px-4 py-3">
                      {formatDecimal(total)} {product.unit}
                    </td>
                    <td className="px-4 py-3">
                      {product.warehouseBalances
                        .filter((balance) => balance.lot)
                        .map(
                          (balance) =>
                            `${balance.lot}: ${formatDecimal(balance.quantity)}`,
                        )
                        .join(", ") || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button asChild variant="secondary">
                          <Link href={`/magazzino/${product.id}`}>
                            Dettaglio
                          </Link>
                        </Button>
                        <Button asChild variant="secondary">
                          <Link href={`/magazzino/${product.id}/modifica`}>
                            Modifica
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Ultimi movimenti</h2>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Data</th>
                <th className="px-4 py-3 text-left">Materiale</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-left">Origine</th>
                <th className="px-4 py-3 text-left">Quantita</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {movements.map((movement) => (
                <tr key={movement.id}>
                  <td className="px-4 py-3">{formatDate(movement.movedOn)}</td>
                  <td className="px-4 py-3">{movement.productMaterial.name}</td>
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
                </tr>
              ))}
              {movements.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-muted-foreground" colSpan={5}>
                    Nessun movimento registrato.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
