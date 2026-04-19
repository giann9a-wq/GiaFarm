"use server";

import { DocumentModule, WarehouseMovementSource, WarehouseMovementType } from "@prisma/client";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { requireUser } from "@/lib/auth/permissions";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { fieldGroupFormSchema, operationFormSchema } from "@/lib/validation/operations";
import {
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

function actionErrorMessage(error: unknown) {
  if (error instanceof ZodError) {
    return error.issues[0]?.message ?? "Controllare i dati inseriti.";
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Impossibile salvare la lavorazione. Controllare i dati e riprovare.";
}

function redirectWithActionError(path: string, error: unknown): never {
  if (isRedirectError(error)) {
    throw error;
  }
  redirect(`${path}?error=${encodeURIComponent(actionErrorMessage(error))}`);
}

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

export async function createOperationAction(formData: FormData) {
  const session = await requireUser();
  try {
    await createOperation(formData, session);
  } catch (error) {
    redirectWithActionError("/lavorazioni/nuova", error);
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
    productMaterialId: stringValue(formData, "productMaterialId") || undefined,
    quantity: stringValue(formData, "quantity") || undefined,
    quantityUnit: stringValue(formData, "quantityUnit") || undefined,
    treatedAreaHa: stringValue(formData, "treatedAreaHa") || undefined,
    treatmentReason: stringValue(formData, "treatmentReason") || undefined,
    notes: stringValue(formData, "notes") || undefined,
    attachmentName: stringValue(formData, "attachmentName") || undefined,
    attachmentDriveFileId: stringValue(formData, "attachmentDriveFileId") || undefined,
    attachmentUrl: stringValue(formData, "attachmentUrl") || undefined
  });

  if (!parsed.fieldGroupId && parsed.fieldIds.length === 0) {
    throw new Error("Selezionare almeno un gruppo o un campo.");
  }
  if (parsed.quantity !== undefined && Number(parsed.quantity) <= 0) {
    throw new Error("La quantita' deve essere positiva.");
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
  if (group?.startsOn && parsed.performedOn < group.startsOn) {
    throw new Error("La lavorazione e' precedente all'inizio del gruppo selezionato.");
  }
  if (group?.endsOn && parsed.performedOn > group.endsOn) {
    throw new Error("La lavorazione e' successiva alla fine del gruppo selezionato.");
  }
  await validateOperationArea({
    treatedAreaHa: parsed.treatedAreaHa,
    fieldGroupId: parsed.fieldGroupId,
    fieldIds: parsed.fieldIds
  });
  const operation = await prisma.operation.create({
    data: {
      campaignId: parsed.campaignId,
      operationTypeId: parsed.operationTypeId,
      performedOn: parsed.performedOn,
      productMaterialId: parsed.productMaterialId || null,
      quantity: parsed.quantity,
      quantityUnit: parsed.quantityUnit || null,
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

  if (parsed.productMaterialId && parsed.quantity) {
    const product = await prisma.productMaterial.findUniqueOrThrow({
      where: { id: parsed.productMaterialId }
    });
    await recordWarehouseMovement({
      productMaterialId: parsed.productMaterialId,
      movementType: WarehouseMovementType.OUT,
      source: WarehouseMovementSource.LAVORAZIONE_OUT,
      sourceId: operation.id,
      operationId: operation.id,
      actorUserId: session.user?.id,
      quantity: parsed.quantity,
      unit: parsed.quantityUnit || product.unit,
      movedOn: parsed.performedOn,
      note: "Scarico automatico da lavorazione"
    });
  }

  if (parsed.attachmentName || parsed.attachmentDriveFileId || parsed.attachmentUrl) {
    const googleDriveFileId =
      parsed.attachmentDriveFileId || `manual-operation-${operation.id}-${Date.now()}`;
    const driveFile = await prisma.driveFile.upsert({
      where: { googleDriveFileId },
      update: {
        name: parsed.attachmentName || "Allegato lavorazione",
        mimeType: "application/pdf",
        module: DocumentModule.OPERATIONS,
        webViewLink: parsed.attachmentUrl || null
      },
      create: {
        googleDriveFileId,
        name: parsed.attachmentName || "Allegato lavorazione",
        mimeType: "application/pdf",
        module: DocumentModule.OPERATIONS,
        webViewLink: parsed.attachmentUrl || null
      }
    });

    await prisma.operationAttachment.create({
      data: {
        operationId: operation.id,
        driveFileId: driveFile.id,
        label: parsed.attachmentName || "Allegato"
      }
    });
  }

  await writeAuditLog({
    actorUserId: session.user?.id,
    action: "OPERATION_CREATED",
    entityType: "Operation",
    entityId: operation.id,
    after: operation
  });

  revalidatePath("/lavorazioni");
  redirect(`/lavorazioni/${operation.id}`);
}

export async function updateOperationAction(operationId: string, formData: FormData) {
  const session = await requireUser();
  try {
    await updateOperation(operationId, formData, session);
  } catch (error) {
    redirectWithActionError(`/lavorazioni/${operationId}/modifica`, error);
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
    productMaterialId: stringValue(formData, "productMaterialId") || undefined,
    quantity: stringValue(formData, "quantity") || undefined,
    quantityUnit: stringValue(formData, "quantityUnit") || undefined,
    treatedAreaHa: stringValue(formData, "treatedAreaHa") || undefined,
    treatmentReason: stringValue(formData, "treatmentReason") || undefined,
    notes: stringValue(formData, "notes") || undefined,
    attachmentName: stringValue(formData, "attachmentName") || undefined,
    attachmentDriveFileId: stringValue(formData, "attachmentDriveFileId") || undefined,
    attachmentUrl: stringValue(formData, "attachmentUrl") || undefined
  });

  if (!parsed.fieldGroupId && parsed.fieldIds.length === 0) {
    throw new Error("Selezionare almeno un gruppo o un campo.");
  }
  if (parsed.quantity !== undefined && Number(parsed.quantity) <= 0) {
    throw new Error("La quantita' deve essere positiva.");
  }

  const before = await prisma.operation.findUniqueOrThrow({
    where: { id: operationId },
    include: { fieldGroups: true, fields: true, attachments: true }
  });
  const campaign = await prisma.campaign.findUniqueOrThrow({ where: { id: parsed.campaignId } });
  requireDateInsideCampaign(parsed.performedOn, campaign);

  const group = parsed.fieldGroupId
    ? await prisma.fieldGroup.findUniqueOrThrow({ where: { id: parsed.fieldGroupId } })
    : null;
  if (group && group.campaignId !== parsed.campaignId) {
    throw new Error("Il gruppo selezionato non appartiene alla campagna scelta.");
  }
  if (group?.startsOn && parsed.performedOn < group.startsOn) {
    throw new Error("La lavorazione e' precedente all'inizio del gruppo selezionato.");
  }
  if (group?.endsOn && parsed.performedOn > group.endsOn) {
    throw new Error("La lavorazione e' successiva alla fine del gruppo selezionato.");
  }
  await validateOperationArea({
    treatedAreaHa: parsed.treatedAreaHa,
    fieldGroupId: parsed.fieldGroupId,
    fieldIds: parsed.fieldIds
  });
  const after = await prisma.$transaction(async (tx) => {
    await tx.operationFieldGroup.deleteMany({ where: { operationId } });
    await tx.operationField.deleteMany({ where: { operationId } });
    await tx.warehouseMovement.deleteMany({
      where: { operationId, source: WarehouseMovementSource.LAVORAZIONE_OUT }
    });

    const updatedOperation = await tx.operation.update({
      where: { id: operationId },
      data: {
        campaignId: parsed.campaignId,
        operationTypeId: parsed.operationTypeId,
        performedOn: parsed.performedOn,
        productMaterialId: parsed.productMaterialId || null,
        quantity: parsed.quantity,
        quantityUnit: parsed.quantityUnit || null,
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

    if (parsed.productMaterialId && parsed.quantity) {
      const product = await tx.productMaterial.findUniqueOrThrow({
        where: { id: parsed.productMaterialId }
      });
      await recordWarehouseMovement(
        {
          productMaterialId: parsed.productMaterialId,
          movementType: WarehouseMovementType.OUT,
          source: WarehouseMovementSource.LAVORAZIONE_OUT,
          sourceId: operationId,
          operationId,
          actorUserId: session.user?.id,
          quantity: parsed.quantity,
          unit: parsed.quantityUnit || product.unit,
          movedOn: parsed.performedOn,
          note: "Scarico automatico da lavorazione"
        },
        tx
      );
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
