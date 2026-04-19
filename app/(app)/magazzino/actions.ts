"use server";

import {
  RoleCode,
  WarehouseMovementSource,
  WarehouseMovementType,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/permissions";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import {
  productMaterialUpdateSchema,
  warehouseAdjustmentSchema,
} from "@/lib/validation/warehouse";
import {
  rebuildWarehouseBalances,
  recordWarehouseMovement,
} from "@/lib/warehouse/stock";

function stringValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function createWarehouseAdjustmentAction(formData: FormData) {
  const session = await requireRole(RoleCode.ADMIN);
  const actorUserId = session.user!.id;
  const parsed = warehouseAdjustmentSchema.parse({
    productMaterialId: stringValue(formData, "productMaterialId"),
    quantity: stringValue(formData, "quantity").replace(",", "."),
    unit: stringValue(formData, "unit"),
    movedOn: `${stringValue(formData, "movedOn")}T00:00:00.000Z`,
    reason: stringValue(formData, "reason"),
  });

  const movementType =
    parsed.quantity > 0 ? WarehouseMovementType.IN : WarehouseMovementType.OUT;
  const absoluteQuantity = Math.abs(parsed.quantity);

  const movement = await prisma.$transaction(async (tx) => {
    const warehouseMovement = await recordWarehouseMovement(
      {
        productMaterialId: parsed.productMaterialId,
        movementType,
        source: WarehouseMovementSource.RETTIFICA_ADMIN,
        sourceId: "manual-adjustment",
        actorUserId,
        quantity: absoluteQuantity,
        unit: parsed.unit,
        movedOn: parsed.movedOn,
        note: parsed.reason,
      },
      tx,
    );

    await tx.warehouseAdjustment.create({
      data: {
        warehouseMovementId: warehouseMovement.id,
        reason: parsed.reason,
        approvedByUserId: actorUserId,
      },
    });

    return warehouseMovement;
  });

  await writeAuditLog({
    actorUserId,
    action: "WAREHOUSE_ADJUSTMENT_CREATED",
    entityType: "WarehouseMovement",
    entityId: movement.id,
    after: movement,
    metadata: { reason: parsed.reason },
  });

  revalidatePath("/magazzino");
  revalidatePath(`/magazzino/${parsed.productMaterialId}`);
  redirect(`/magazzino/${parsed.productMaterialId}`);
}

export async function updateProductMaterialAction(
  productMaterialId: string,
  formData: FormData,
) {
  const session = await requireRole(RoleCode.ADMIN);
  const actorUserId = session.user!.id;
  const parsed = productMaterialUpdateSchema.parse({
    name: stringValue(formData, "name"),
    code: stringValue(formData, "code") || undefined,
    category: stringValue(formData, "category"),
    unit: stringValue(formData, "unit"),
    active: formData.get("active") === "on",
    notes: stringValue(formData, "notes") || undefined,
  });

  const before = await prisma.productMaterial.findUnique({
    where: { id: productMaterialId },
  });
  const product = await prisma.productMaterial.update({
    where: { id: productMaterialId },
    data: {
      name: parsed.name,
      code: parsed.code || null,
      category: parsed.category,
      unit: parsed.unit,
      active: parsed.active,
      notes: parsed.notes || null,
    },
  });

  await writeAuditLog({
    actorUserId,
    action: "PRODUCT_MATERIAL_UPDATED",
    entityType: "ProductMaterial",
    entityId: product.id,
    before,
    after: product,
  });

  revalidatePath("/magazzino");
  revalidatePath(`/magazzino/${product.id}`);
  redirect(`/magazzino/${product.id}`);
}

export async function updateWarehouseAdjustmentAction(
  warehouseMovementId: string,
  formData: FormData,
) {
  const session = await requireRole(RoleCode.ADMIN);
  const actorUserId = session.user!.id;
  const before = await prisma.warehouseMovement.findUnique({
    where: { id: warehouseMovementId },
    include: { adjustment: true },
  });
  if (!before || before.source !== WarehouseMovementSource.RETTIFICA_ADMIN) {
    throw new Error(
      "Solo le rettifiche admin possono essere modificate dal magazzino.",
    );
  }

  const parsed = warehouseAdjustmentSchema.parse({
    productMaterialId: before.productMaterialId,
    quantity: stringValue(formData, "quantity").replace(",", "."),
    unit: stringValue(formData, "unit"),
    movedOn: `${stringValue(formData, "movedOn")}T00:00:00.000Z`,
    reason: stringValue(formData, "reason"),
  });
  const movementType =
    parsed.quantity > 0 ? WarehouseMovementType.IN : WarehouseMovementType.OUT;
  const absoluteQuantity = Math.abs(parsed.quantity);

  const updated = await prisma.$transaction(async (tx) => {
    const movement = await tx.warehouseMovement.update({
      where: { id: warehouseMovementId },
      data: {
        movementType,
        quantity: absoluteQuantity,
        unit: parsed.unit,
        movedOn: parsed.movedOn,
        note: parsed.reason,
      },
    });
    await tx.warehouseAdjustment.upsert({
      where: { warehouseMovementId },
      update: {
        reason: parsed.reason,
        approvedByUserId: actorUserId,
      },
      create: {
        warehouseMovementId,
        reason: parsed.reason,
        approvedByUserId: actorUserId,
      },
    });
    await rebuildWarehouseBalances(tx);
    return movement;
  });

  await writeAuditLog({
    actorUserId,
    action: "WAREHOUSE_ADJUSTMENT_UPDATED",
    entityType: "WarehouseMovement",
    entityId: updated.id,
    before,
    after: updated,
    metadata: { reason: parsed.reason },
  });

  revalidatePath("/magazzino");
  revalidatePath(`/magazzino/${before.productMaterialId}`);
  redirect(`/magazzino/${before.productMaterialId}`);
}
