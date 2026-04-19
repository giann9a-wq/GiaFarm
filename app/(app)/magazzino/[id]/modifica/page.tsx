import Link from "next/link";
import { RoleCode } from "@prisma/client";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { updateProductMaterialAction } from "@/app/(app)/magazzino/actions";
import { requireRole } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

export default async function EditWarehouseProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(RoleCode.ADMIN);
  const { id } = await params;
  const product = await prisma.productMaterial.findUnique({ where: { id } });
  if (!product) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Modifica ${product.name}`}
        subtitle="Aggiorna i dati anagrafici del materiale usato da magazzino, bolle, DDT e lavorazioni."
      />
      <Button asChild variant="secondary">
        <Link href={`/magazzino/${product.id}`}>Torna al dettaglio</Link>
      </Button>

      <Card>
        <CardHeader>
          <h2 className="font-semibold">Dati materiale</h2>
        </CardHeader>
        <CardContent>
          <form
            action={updateProductMaterialAction.bind(null, product.id)}
            className="grid gap-4 md:grid-cols-2"
          >
            <label className="text-sm font-medium">
              Nome materiale
              <input
                className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
                defaultValue={product.name}
                name="name"
                required
              />
            </label>
            <label className="text-sm font-medium">
              Codice
              <input
                className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
                defaultValue={product.code ?? ""}
                name="code"
              />
            </label>
            <label className="text-sm font-medium">
              Categoria
              <input
                className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
                defaultValue={product.category}
                name="category"
                required
              />
            </label>
            <label className="text-sm font-medium">
              Unita di misura
              <input
                className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
                defaultValue={product.unit}
                name="unit"
                required
              />
            </label>
            <label className="flex items-center gap-2 rounded-[8px] border border-border px-3 py-2 text-sm md:col-span-2">
              <input
                defaultChecked={product.active}
                name="active"
                type="checkbox"
              />
              Materiale attivo e selezionabile
            </label>
            <label className="text-sm font-medium md:col-span-2">
              Note
              <textarea
                className="focus-ring mt-2 min-h-24 w-full rounded-[8px] border border-input bg-background px-3 py-2"
                defaultValue={product.notes ?? ""}
                name="notes"
              />
            </label>
            <div className="md:col-span-2">
              <Button type="submit">Salva modifiche</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
