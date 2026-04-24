import { prisma } from "@/lib/prisma";

type ProductDocumentFilters = {
  productId?: string;
  from?: string;
  to?: string;
};

export async function getProductDocuments(
  filters: ProductDocumentFilters = {},
) {
  return prisma.productDocument.findMany({
    where: {
      ...(filters.productId ? { productMaterialId: filters.productId } : {}),
      ...(filters.from || filters.to
        ? {
            purchasedOn: {
              ...(filters.from
                ? { gte: new Date(`${filters.from}T00:00:00.000Z`) }
                : {}),
              ...(filters.to
                ? { lte: new Date(`${filters.to}T23:59:59.999Z`) }
                : {}),
            },
          }
        : {}),
    },
    include: {
      productMaterial: true,
      driveFile: true,
    },
    orderBy: [{ purchasedOn: "desc" }, { createdAt: "desc" }],
  });
}

export async function getProductDocumentFormData() {
  const products = await prisma.productMaterial.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });

  return { products };
}
