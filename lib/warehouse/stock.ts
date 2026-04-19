import {
  Prisma,
  type PrismaClient,
  WarehouseMovementSource,
  WarehouseMovementType
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

type TxClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

type MovementInput = {
  productMaterialId: string;
  movementType: WarehouseMovementType;
  source: WarehouseMovementSource;
  sourceId?: string;
  operationId?: string;
  inboundDeliveryRowId?: string;
  outboundDdtRowId?: string;
  actorUserId?: string;
  quantity: string | number | Prisma.Decimal;
  unit: string;
  movedOn: Date;
  lot?: string | null;
  note?: string | null;
};

function signedQuantity(type: WarehouseMovementType, quantity: string | number | Prisma.Decimal) {
  const value = Number(quantity);
  if (type === WarehouseMovementType.OUT) return -value;
  return value;
}

export async function getAvailableQuantity(
  productMaterialId: string,
  lot?: string | null,
  client: TxClient = prisma
) {
  const movements = await client.warehouseMovement.findMany({
    where: {
      productMaterialId,
      ...(lot ? { lot } : {})
    },
    select: { movementType: true, quantity: true }
  });

  return movements.reduce((sum, movement) => {
    return sum + signedQuantity(movement.movementType, movement.quantity);
  }, 0);
}

export async function assertAvailableStock(input: {
  productMaterialId: string;
  quantity: string | number | Prisma.Decimal;
  lot?: string | null;
  label?: string;
  client?: TxClient;
}) {
  const available = await getAvailableQuantity(
    input.productMaterialId,
    input.lot,
    input.client ?? prisma
  );
  const requested = Number(input.quantity);
  if (requested > available) {
    throw new Error(
      `${input.label ?? "Il materiale"} non ha giacenza sufficiente: disponibili ${available.toFixed(
        3
      )}.`
    );
  }
}

export async function recordWarehouseMovement(input: MovementInput, client: TxClient = prisma) {
  const movement = await client.warehouseMovement.create({
    data: {
      productMaterialId: input.productMaterialId,
      movementType: input.movementType,
      source: input.source,
      sourceId: input.sourceId,
      operationId: input.operationId,
      inboundDeliveryRowId: input.inboundDeliveryRowId,
      outboundDdtRowId: input.outboundDdtRowId,
      actorUserId: input.actorUserId,
      quantity: input.quantity,
      unit: input.unit,
      movedOn: input.movedOn,
      lot: input.lot || null,
      note: input.note || null
    }
  });

  const existingBalance = await client.warehouseBalance.findFirst({
    where: {
      productMaterialId: input.productMaterialId,
      lot: input.lot || null
    }
  });
  const delta = signedQuantity(input.movementType, input.quantity);

  if (existingBalance) {
    await client.warehouseBalance.update({
      where: { id: existingBalance.id },
      data: {
        quantity: new Prisma.Decimal(existingBalance.quantity).plus(delta),
        unit: input.unit
      }
    });
  } else {
    await client.warehouseBalance.create({
      data: {
        productMaterialId: input.productMaterialId,
        lot: input.lot || null,
        quantity: delta,
        unit: input.unit
      }
    });
  }

  return movement;
}

export async function rebuildWarehouseBalances(client: TxClient = prisma) {
  const movements = await client.warehouseMovement.findMany({
    include: { productMaterial: true },
    orderBy: { createdAt: "asc" }
  });

  const balances = new Map<
    string,
    { productMaterialId: string; lot: string | null; quantity: number; unit: string }
  >();

  for (const movement of movements) {
    const lot = movement.lot || null;
    const key = `${movement.productMaterialId}:${lot ?? ""}`;
    const current =
      balances.get(key) ?? {
        productMaterialId: movement.productMaterialId,
        lot,
        quantity: 0,
        unit: movement.unit || movement.productMaterial.unit
      };
    current.quantity += signedQuantity(movement.movementType, movement.quantity);
    current.unit = movement.unit || current.unit;
    balances.set(key, current);
  }

  await client.warehouseBalance.deleteMany();
  if (balances.size > 0) {
    await client.warehouseBalance.createMany({
      data: Array.from(balances.values()).map((balance) => ({
        productMaterialId: balance.productMaterialId,
        lot: balance.lot,
        quantity: balance.quantity,
        unit: balance.unit
      }))
    });
  }
}
