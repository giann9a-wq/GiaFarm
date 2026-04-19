"use server";

import { RoleCode, WarehouseMovementSource, WarehouseMovementType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/permissions";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { warehouseAdjustmentSchema } from "@/lib/validation/warehouse";
import { recordWarehouseMovement } from "@/lib/warehouse/stock";

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
    reason: stringValue(formData, "reason")
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
        note: parsed.reason
      },
      tx
    );

    await tx.warehouseAdjustment.create({
      data: {
        warehouseMovementId: warehouseMovement.id,
        reason: parsed.reason,
        approvedByUserId: actorUserId
      }
    });

    return warehouseMovement;
  });

  await writeAuditLog({
    actorUserId,
    action: "WAREHOUSE_ADJUSTMENT_CREATED",
    entityType: "WarehouseMovement",
    entityId: movement.id,
    after: movement,
    metadata: { reason: parsed.reason }
  });

  revalidatePath("/magazzino");
  revalidatePath(`/magazzino/${parsed.productMaterialId}`);
  redirect(`/magazzino/${parsed.productMaterialId}`);
}
