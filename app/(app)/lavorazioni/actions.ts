"use server";

import { DocumentModule, WarehouseMovementSource, WarehouseMovementType } from "@prisma/client";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { requireUser } from "@/lib/auth/permissions";
import { writeAuditLog } from "@/lib/audit";
import { upsertInlinePdf } from "@/lib/documents";
import { prisma } from "@/lib/prisma";
import { fieldGroupFormSchema, operationFormSchema } from "@/lib/validation/operations";
import {
  assertAvailableStock,
  rebuildWarehouseBalances,
  recordWarehouseMovement
} from "@/lib/warehouse/stock";

function stringValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function optionalDateValue(formData: FormData, key: string) {
  const value = stringValue(formData, key);
  return value ? new Date(`${value}T00:00:00.000Z`) : undefined;
}

function selectedValues(formData: FormData, key: string) {
  return formData
    .getAll(key)
    .map((value) => String(value))
    .filter(Boolean);
}

function parseProductRows(formData: FormData, maxRows = 4) {
  return Array.from({ length: maxRows }, (_, index) => ({
    productMaterialId:
      stringValue(formData, `products.${index}.productMaterialId`) || undefined,
    quantity: stringValue(formData, `products.${index}.quantity`) || undefined,
    unit: stringValue(formData, `products.${index}.unit`) || undefined,
    note: stringValue(formData, `products.${index}.note`) || undefined
  })).filter((row) => row.productMaterialId || row.quantity || row.unit || row.note);
}

function actionErrorMessage(error: unknown) {
  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? "Controllare i dati inseriti.";
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Impossibile salvare la lavorazione. Controllare i dati e riprovare.";
}

export type OperationActionState = {
  error?: string;
};

function requireDateInsideCampaign(date: Date, campaign: { startsOn: Date; endsOn: Date }) {
  if (date < campaign.startsOn || date > campaign.endsOn) {
    throw new Error("La data della lavorazione deve ricadere dentro la campagna selezionata.");
  }
}

async function maxAllowedAreaHa(input: { fieldGroupId?: string; fieldIds: string[] }) {
  const group = input.fieldGroupId
    ? await prisma.fieldGroup.findUnique({
        where: { id: input.fieldGroupId },
        include: {
          memberships: { include: { field: { include: { usageHistory: true } } } }
        }
      })
    : null;
  const directFields =
    input.fieldIds.length > 0
      ? await prisma.field.findMany({
          where: { id: { in: input.fieldIds } },
          include: { usageHistory: true }
        })
      : [];

  const fieldMap = new Map<string, { usageHistory: { year: number; usedAreaSqm: unknown }[] }>();
  for (const membership of group?.memberships ?? []) {
    fieldMap.set(membership.field.id, membership.field);
  }
  for (const field of directFields) {
    fieldMap.set(field.id, field);
  }

  return (
    Array.from(fieldMap.values()).reduce((sum, field) => {
      const latest = field.usageHistory.slice().sort((a, b) => b.year - a.year)[0];
      return sum + (latest ? Number(latest.usedAreaSqm) : 0);
    }, 0) / 10000
  );
}

async function validateOperationArea(input: {
  treatedAreaHa?: string;
  fieldGroupId?: string;
  fieldIds: string[];
}) {
  if (input.treatedAreaHa !== undefined && Number(input.treatedAreaHa) < 0) {
    throw new Error("La superficie trattata non puo' essere negativa.");
  }

  const maxAreaHa = await maxAllowedAreaHa(input);
  if (
    input.treatedAreaHa !== undefined &&
    maxAreaHa > 0 &&
    Number(input.treatedAreaHa) > maxAreaHa
  ) {
    throw new Error(
      `La superficie trattata non puo' superare la superficie coltivata (${maxAreaHa.toFixed(4)} ha).`
    );
  }
}

async function validateMaterials(
  rows: {
    productMaterialId?: string;
    quantity?: string;
    unit?: string;
    note?: string;
  }[],
  releasedByProduct: Map<string, number> = new Map()
) {
  for (const row of rows) {
    if (!row.productMaterialId && !row.quantity && !row.unit && !row.note) continue;
    if (!row.productMaterialId) {
      throw new Error("Ogni riga prodotto compilata deve avere un materiale selezionato.");
    }
    if (!row.quantity || Number(row.quantity.replace(",", ".")) <= 0) {
      throw new Error("La quantità dei prodotti usati deve essere positiva.");
    }
    const product = await prisma.productMaterial.findUniqueOrThrow({
      where: { id: row.productMaterialId }
    });
    const requested = Number(row.quantity.replace(",", "."));
    const released = releasedByProduct.get(row.productMaterialId) ?? 0;
    const available = requested - released;
    if (available > 0) {
      await assertAvailableStock({
        productMaterialId: row.productMaterialId,
        quantity: available,
        label: product.name
      });
    }
  }
}

export async function createOperationAction(
  _state: OperationActionState,
  formData: FormData
): Promise<OperationActionState> {
  const session = await requireUser();
  try {
    await createOperation(formData, session);
    return {};
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    return { error: actionErrorMessage(error) };
  }
}

async function createOperation(
  formData: FormData,
  session: Awaited<ReturnType<typeof requireUser>>
) {
  const parsed = operationFormSchema.parse({
    campaignId: stringValue(formData, "campaignId"),
    operationTypeId: stringValue(formData, "operationTypeId"),
    performedOn: `${stringValue(formData, "performedOn")}T00:00:00.000Z`,
    fieldGroupId: stringValue(formData, "fieldGroupId") || undefined,
    fieldIds: selectedValues(formData, "fieldIds"),
    treatedAreaHa: stringValue(formData, "treatedAreaHa") || undefined,
    treatmentReason: stringValue(formData, "treatmentReason") || undefined,
    notes: stringValue(formData, "notes") || undefined,
    products: parseProductRows(formData)
  });

  if (!parsed.fieldGroupId && parsed.fieldIds.length === 0) {
    throw new Error("Selezionare almeno un gruppo o un campo.");
  }

  const campaign = await prisma.campaign.findUniqueOrThrow({
    where: { id: parsed.campaignId }
  });
  requireDateInsideCampaign(parsed.performedOn, campaign);

  const group = parsed.fieldGroupId
    ? await prisma.fieldGroup.findUniqueOrThrow({
        where: { id: parsed.fieldGroupId },
        include: { memberships: true }
      })
    : null;

  if (group && group.campaignId !== parsed.campaignId) {
    throw new Error("Il gruppo selezionato non appartiene alla campagna scelta.");
  }
  await validateOperationArea({
    treatedAreaHa: parsed.treatedAreaHa,
    fieldGroupId: parsed.fieldGroupId,
    fieldIds: parsed.fieldIds
  });
  await validateMaterials(parsed.products);
  const operation = await prisma.$transaction(async (tx) => {
    const firstMaterial = parsed.products.find((row) => row.productMaterialId && row.quantity);
    const firstProduct = firstMaterial?.productMaterialId
      ? await tx.productMaterial.findUnique({ where: { id: firstMaterial.productMaterialId } })
      : null;
    const createdOperation = await tx.operation.create({
      data: {
        campaignId: parsed.campaignId,
        operationTypeId: parsed.operationTypeId,
        performedOn: parsed.performedOn,
        productMaterialId: firstMaterial?.productMaterialId || null,
        quantity: firstMaterial?.quantity?.replace(",", "."),
        quantityUnit: firstMaterial?.unit || firstProduct?.unit || null,
        treatedAreaHa: parsed.treatedAreaHa,
        treatmentReason: parsed.treatmentReason || null,
        notes: parsed.notes || null,
        fieldGroups: parsed.fieldGroupId
          ? { create: [{ fieldGroupId: parsed.fieldGroupId }] }
          : undefined,
        fields:
          parsed.fieldIds.length > 0
            ? { create: parsed.fieldIds.map((fieldId) => ({ fieldId })) }
            : undefined
      }
    });

    for (const row of parsed.products) {
      if (!row.productMaterialId || !row.quantity) continue;
      const product = await tx.productMaterial.findUniqueOrThrow({
        where: { id: row.productMaterialId }
      });
      await tx.operationMaterialUsage.create({
        data: {
          operationId: createdOperation.id,
          productMaterialId: row.productMaterialId,
          quantity: row.quantity.replace(",", "."),
          unit: row.unit || product.unit,
          note: row.note || null
        }
      });
      await recordWarehouseMovement(
        {
          productMaterialId: row.productMaterialId,
          movementType: WarehouseMovementType.OUT,
          source: WarehouseMovementSource.LAVORAZIONE_OUT,
          sourceId: createdOperation.id,
          operationId: createdOperation.id,
          actorUserId: session.user?.id,
          quantity: row.quantity.replace(",", "."),
          unit: row.unit || product.unit,
          movedOn: parsed.performedOn,
          note: row.note || "Scarico automatico da lavorazione"
        },
        tx
      );
    }

    const attachmentFile = formData.get("attachmentFile");
    if (attachmentFile instanceof File && attachmentFile.size > 0) {
      const driveFile = await upsertInlinePdf(
        {
          file: attachmentFile,
          module: DocumentModule.OPERATIONS
        },
        tx
      );
      await tx.operationAttachment.create({
        data: {
          operationId: createdOperation.id,
          driveFileId: driveFile.id,
          label: attachmentFile.name || "Allegato lavorazione"
        }
      });
    }

    await rebuildWarehouseBalances(tx);
    return createdOperation;
  });

  await writeAuditLog({
    actorUserId: session.user?.id,
    action: "OPERATION_CREATED",
    entityType: "Operation",
    entityId: operation.id,
    after: operation
  });

  revalidatePath("/lavorazioni");
  redirect("/lavorazioni");
}

export async function updateOperationAction(
  operationId: string,
  _state: OperationActionState,
  formData: FormData
): Promise<OperationActionState> {
  const session = await requireUser();
  try {
    await updateOperation(operationId, formData, session);
    return {};
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }
    return { error: actionErrorMessage(error) };
  }
}

async function updateOperation(
  operationId: string,
  formData: FormData,
  session: Awaited<ReturnType<typeof requireUser>>
) {
  const parsed = operationFormSchema.parse({
    campaignId: stringValue(formData, "campaignId"),
    operationTypeId: stringValue(formData, "operationTypeId"),
    performedOn: `${stringValue(formData, "performedOn")}T00:00:00.000Z`,
    fieldGroupId: stringValue(formData, "fieldGroupId") || undefined,
    fieldIds: selectedValues(formData, "fieldIds"),
    treatedAreaHa: stringValue(formData, "treatedAreaHa") || undefined,
    treatmentReason: stringValue(formData, "treatmentReason") || undefined,
    notes: stringValue(formData, "notes") || undefined,
    products: parseProductRows(formData)
  });

  if (!parsed.fieldGroupId && parsed.fieldIds.length === 0) {
    throw new Error("Selezionare almeno un gruppo o un campo.");
  }

  const before = await prisma.operation.findUniqueOrThrow({
    where: { id: operationId },
    include: { fieldGroups: true, fields: true, attachments: true, materialUsages: true }
  });
  const campaign = await prisma.campaign.findUniqueOrThrow({ where: { id: parsed.campaignId } });
  requireDateInsideCampaign(parsed.performedOn, campaign);

  const group = parsed.fieldGroupId
    ? await prisma.fieldGroup.findUniqueOrThrow({ where: { id: parsed.fieldGroupId } })
    : null;
  if (group && group.campaignId !== parsed.campaignId) {
    throw new Error("Il gruppo selezionato non appartiene alla campagna scelta.");
  }
  await validateOperationArea({
    treatedAreaHa: parsed.treatedAreaHa,
    fieldGroupId: parsed.fieldGroupId,
    fieldIds: parsed.fieldIds
  });
  const releasedByProduct = new Map<string, number>();
  for (const usage of before.materialUsages) {
    releasedByProduct.set(
      usage.productMaterialId,
      (releasedByProduct.get(usage.productMaterialId) ?? 0) + Number(usage.quantity)
    );
  }
  await validateMaterials(parsed.products, releasedByProduct);
  const after = await prisma.$transaction(async (tx) => {
    await tx.operationFieldGroup.deleteMany({ where: { operationId } });
    await tx.operationField.deleteMany({ where: { operationId } });
    await tx.operationMaterialUsage.deleteMany({ where: { operationId } });
    await tx.warehouseMovement.deleteMany({
      where: { operationId, source: WarehouseMovementSource.LAVORAZIONE_OUT }
    });

    const firstMaterial = parsed.products.find((row) => row.productMaterialId && row.quantity);
    const firstProduct = firstMaterial?.productMaterialId
      ? await tx.productMaterial.findUnique({ where: { id: firstMaterial.productMaterialId } })
      : null;
    const updatedOperation = await tx.operation.update({
      where: { id: operationId },
      data: {
        campaignId: parsed.campaignId,
        operationTypeId: parsed.operationTypeId,
        performedOn: parsed.performedOn,
        productMaterialId: firstMaterial?.productMaterialId || null,
        quantity: firstMaterial?.quantity?.replace(",", "."),
        quantityUnit: firstMaterial?.unit || firstProduct?.unit || null,
        treatedAreaHa: parsed.treatedAreaHa,
        treatmentReason: parsed.treatmentReason || null,
        notes: parsed.notes || null,
        fieldGroups: parsed.fieldGroupId
          ? { create: [{ fieldGroupId: parsed.fieldGroupId }] }
          : undefined,
        fields:
          parsed.fieldIds.length > 0
            ? { create: parsed.fieldIds.map((fieldId) => ({ fieldId })) }
            : undefined
      }
    });

    for (const row of parsed.products) {
      if (!row.productMaterialId || !row.quantity) continue;
      const product = await tx.productMaterial.findUniqueOrThrow({
        where: { id: row.productMaterialId }
      });
      await tx.operationMaterialUsage.create({
        data: {
          operationId,
          productMaterialId: row.productMaterialId,
          quantity: row.quantity.replace(",", "."),
          unit: row.unit || product.unit,
          note: row.note || null
        }
      });
      await recordWarehouseMovement(
        {
          productMaterialId: row.productMaterialId,
          movementType: WarehouseMovementType.OUT,
          source: WarehouseMovementSource.LAVORAZIONE_OUT,
          sourceId: operationId,
          operationId,
          actorUserId: session.user?.id,
          quantity: row.quantity.replace(",", "."),
          unit: row.unit || product.unit,
          movedOn: parsed.performedOn,
          note: row.note || "Scarico automatico da lavorazione"
        },
        tx
      );
    }

    const attachmentFile = formData.get("attachmentFile");
    if (attachmentFile instanceof File && attachmentFile.size > 0) {
      const driveFile = await upsertInlinePdf(
        {
          file: attachmentFile,
          module: DocumentModule.OPERATIONS,
          existingDriveFileId: before.attachments[0]?.driveFileId
        },
        tx
      );
      if (before.attachments[0]) {
        await tx.operationAttachment.update({
          where: { id: before.attachments[0].id },
          data: {
            driveFileId: driveFile.id,
            label: attachmentFile.name || "Allegato lavorazione"
          }
        });
      } else {
        await tx.operationAttachment.create({
          data: {
            operationId,
            driveFileId: driveFile.id,
            label: attachmentFile.name || "Allegato lavorazione"
          }
        });
      }
    }

    await rebuildWarehouseBalances(tx);
    return updatedOperation;
  });

  await writeAuditLog({
    actorUserId: session.user?.id,
    action: "OPERATION_UPDATED",
    entityType: "Operation",
    entityId: operationId,
    before,
    after
  });

  revalidatePath("/lavorazioni");
  revalidatePath(`/lavorazioni/${operationId}`);
  redirect(`/lavorazioni/${operationId}`);
}

export async function deleteOperationAction(operationId: string) {
  const session = await requireUser();
  const before = await prisma.operation.findUniqueOrThrow({
    where: { id: operationId },
    include: { fieldGroups: true, fields: true, attachments: true }
  });

  await prisma.$transaction(async (tx) => {
    await tx.warehouseMovement.deleteMany({ where: { operationId } });
    await tx.calendarEvent.deleteMany({ where: { operationId } });
    await tx.operationAttachment.deleteMany({ where: { operationId } });
    await tx.operationFieldGroup.deleteMany({ where: { operationId } });
    await tx.operationField.deleteMany({ where: { operationId } });
    await tx.operation.delete({ where: { id: operationId } });
    await rebuildWarehouseBalances(tx);
  });

  await writeAuditLog({
    actorUserId: session.user?.id,
    action: "OPERATION_DELETED",
    entityType: "Operation",
    entityId: operationId,
    before
  });

  revalidatePath("/lavorazioni");
  redirect("/lavorazioni");
}

export async function createFieldGroupAction(formData: FormData) {
  const session = await requireUser();
  const parsed = fieldGroupFormSchema.parse({
    campaignId: stringValue(formData, "campaignId"),
    name: stringValue(formData, "name"),
    cropId: stringValue(formData, "cropId") || undefined,
    startsOn: optionalDateValue(formData, "startsOn"),
    endsOn: optionalDateValue(formData, "endsOn"),
    fieldIds: selectedValues(formData, "fieldIds"),
    notes: stringValue(formData, "notes") || undefined
  });

  const campaign = await prisma.campaign.findUniqueOrThrow({
    where: { id: parsed.campaignId }
  });
  if (parsed.startsOn) requireDateInsideCampaign(parsed.startsOn, campaign);
  if (parsed.endsOn) requireDateInsideCampaign(parsed.endsOn, campaign);
  if (parsed.startsOn && parsed.endsOn && parsed.endsOn < parsed.startsOn) {
    throw new Error("La fine del gruppo non puo' precedere l'inizio.");
  }

  const group = await prisma.fieldGroup.create({
    data: {
      campaignId: parsed.campaignId,
      name: parsed.name,
      cropId: parsed.cropId || null,
      startsOn: parsed.startsOn,
      endsOn: parsed.endsOn,
      notes: parsed.notes || null,
      memberships:
        parsed.fieldIds.length > 0
          ? { create: parsed.fieldIds.map((fieldId) => ({ fieldId })) }
          : undefined
    }
  });

  await writeAuditLog({
    actorUserId: session.user?.id,
    action: "FIELD_GROUP_CREATED",
    entityType: "FieldGroup",
    entityId: group.id,
    after: group,
    metadata: { fieldIds: parsed.fieldIds }
  });

  revalidatePath("/lavorazioni");
  revalidatePath("/lavorazioni/gruppi");
  redirect("/lavorazioni/gruppi");
}

export async function deleteFieldGroupAction(fieldGroupId: string) {
  const session = await requireUser();
  const before = await prisma.fieldGroup.findUniqueOrThrow({
    where: { id: fieldGroupId },
    include: { memberships: true, operations: true }
  });

  if (before.operations.length > 0) {
    throw new Error("Non puoi eliminare un gruppo collegato a lavorazioni. Elimina o sposta prima le lavorazioni.");
  }

  await prisma.$transaction([
    prisma.fieldGroupMembership.deleteMany({ where: { fieldGroupId } }),
    prisma.fieldGroup.delete({ where: { id: fieldGroupId } })
  ]);

  await writeAuditLog({
    actorUserId: session.user?.id,
    action: "FIELD_GROUP_DELETED",
    entityType: "FieldGroup",
    entityId: fieldGroupId,
    before
  });

  revalidatePath("/lavorazioni");
  revalidatePath("/lavorazioni/gruppi");
  redirect("/lavorazioni/gruppi");
}
