import { WarehouseMovementType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function getDeliveryOverview() {
  const [inboundNotes, outboundDdt, suppliers, customers, products] = await Promise.all([
    prisma.inboundDeliveryNote.findMany({
      include: {
        supplier: true,
        rows: { include: { productMaterial: true } },
        driveFile: true
      },
      orderBy: [{ issuedOn: "desc" }, { createdAt: "desc" }]
    }),
    prisma.outboundDdt.findMany({
      include: {
        customer: true,
        rows: { include: { productMaterial: true } }
      },
      orderBy: [{ issuedOn: "desc" }, { sequenceNumber: "desc" }]
    }),
    prisma.supplier.findMany({ orderBy: { businessName: "asc" } }),
    prisma.customer.findMany({ orderBy: { businessName: "asc" } }),
    prisma.productMaterial.findMany({ where: { active: true }, orderBy: { name: "asc" } })
  ]);

  return { inboundNotes, outboundDdt, suppliers, customers, products };
}

export async function getDeliveryMasterData() {
  const [suppliers, customers, destinations] = await Promise.all([
    prisma.supplier.findMany({ orderBy: { businessName: "asc" } }),
    prisma.customer.findMany({ orderBy: { businessName: "asc" } }),
    prisma.ddtDestination.findMany({
      include: { customer: true },
      orderBy: [{ name: "asc" }]
    })
  ]);

  return { suppliers, customers, destinations };
}

export async function getInboundDeliveryNote(id: string) {
  return prisma.inboundDeliveryNote.findUnique({
    where: { id },
    include: {
      supplier: true,
      driveFile: true,
      rows: {
        include: {
          productMaterial: true,
          warehouseMovements: true
        }
      }
    }
  });
}

export async function getOutboundDdt(id: string) {
  return prisma.outboundDdt.findUnique({
    where: { id },
    include: {
      customer: true,
      destination: true,
      rows: {
        include: {
          productMaterial: true,
          warehouseMovements: true
        }
      }
    }
  });
}

export async function getInboundFormData() {
  const [suppliers, products, units] = await Promise.all([
    prisma.supplier.findMany({ orderBy: { businessName: "asc" } }),
    prisma.productMaterial.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.unitOfMeasure.findMany({ orderBy: { code: "asc" } })
  ]);

  return { suppliers, products, units };
}

export async function getDdtFormData() {
  const [customers, destinations, products, units, balances] = await Promise.all([
    prisma.customer.findMany({ orderBy: { businessName: "asc" } }),
    prisma.ddtDestination.findMany({
      include: { customer: true },
      orderBy: [{ name: "asc" }]
    }),
    prisma.productMaterial.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.unitOfMeasure.findMany({ orderBy: { code: "asc" } }),
    prisma.warehouseBalance.findMany({ include: { productMaterial: true } })
  ]);

  return { customers, destinations, products, units, balances };
}

export async function getWarehouseOverview() {
  const [products, movements] = await Promise.all([
    prisma.productMaterial.findMany({
      where: { active: true },
      include: { warehouseBalances: true },
      orderBy: { name: "asc" }
    }),
    prisma.warehouseMovement.findMany({
      include: { productMaterial: true },
      orderBy: [{ movedOn: "desc" }, { createdAt: "desc" }],
      take: 20
    })
  ]);

  return { products, movements };
}

export async function getWarehouseProductDetail(productId: string) {
  return prisma.productMaterial.findUnique({
    where: { id: productId },
    include: {
      warehouseBalances: true,
      warehouseMovements: {
        include: {
          inboundDeliveryRow: { include: { inboundDeliveryNote: true } },
          outboundDdtRow: { include: { outboundDdt: true } },
          operation: true,
          adjustment: true
        },
        orderBy: [{ movedOn: "desc" }, { createdAt: "desc" }]
      },
      documents: { include: { driveFile: true } }
    }
  });
}

export function signedMovementQuantity(movement: {
  movementType: WarehouseMovementType;
  quantity: unknown;
}) {
  const value = Number(movement.quantity);
  return movement.movementType === WarehouseMovementType.OUT ? -value : value;
}
