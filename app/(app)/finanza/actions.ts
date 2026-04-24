"use server";

import { DocumentModule, FinanceEntryType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/permissions";
import { writeAuditLog } from "@/lib/audit";
import { upsertInlinePdf } from "@/lib/documents";
import { prisma } from "@/lib/prisma";
import {
  financeCostSchema,
  financeRevenueSchema,
} from "@/lib/validation/finance";

function stringValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function parseAllocations(formData: FormData, maxRows = 6) {
  return Array.from({ length: maxRows }, (_, index) => ({
    fieldGroupId:
      stringValue(formData, `allocations.${index}.fieldGroupId`) || undefined,
    amount: stringValue(formData, `allocations.${index}.amount`) || undefined,
    percentage:
      stringValue(formData, `allocations.${index}.percentage`) || undefined,
    note: stringValue(formData, `allocations.${index}.note`) || undefined,
  }));
}

function resolveAllocations(
  input: Array<{
    fieldGroupId?: string;
    amount?: string | number;
    percentage?: string | number;
    note?: string;
  }>,
  totalAmount: number,
) {
  const allocations = input
    .filter((row) => row.fieldGroupId)
    .map((row) => {
      const amount = row.amount
        ? Number(String(row.amount).replace(",", "."))
        : 0;
      const percentage = row.percentage
        ? Number(String(row.percentage).replace(",", "."))
        : 0;
      const resolvedAmount =
        amount > 0 ? amount : (totalAmount * percentage) / 100;
      return {
        fieldGroupId: row.fieldGroupId!,
        amount: resolvedAmount,
        note: row.note || null,
      };
    })
    .filter((row) => row.amount > 0);

  const allocated = allocations.reduce((sum, row) => sum + row.amount, 0);
  if (allocated > totalAmount + 0.01) {
    throw new Error("Le allocazioni superano l'importo totale del documento.");
  }

  return allocations;
}

async function maybeStoreFinancePdf(
  formData: FormData,
  existingDriveFileId?: string | null,
) {
  const file = formData.get("pdf");
  if (!(file instanceof File) || file.size === 0) {
    return existingDriveFileId ?? null;
  }
  const driveFile = await upsertInlinePdf({
    file,
    module: DocumentModule.FINANCE,
    existingDriveFileId,
  });
  return driveFile.id;
}

export async function createFinanceCostAction(formData: FormData) {
  const session = await requireUser();
  const actorUserId = session.user!.id;
  const parsed = financeCostSchema.parse({
    supplierId: stringValue(formData, "supplierId") || undefined,
    occurredOn: `${stringValue(formData, "occurredOn")}T00:00:00.000Z`,
    documentNumber: stringValue(formData, "documentNumber") || undefined,
    campaignId: stringValue(formData, "campaignId") || undefined,
    category: stringValue(formData, "category"),
    description: stringValue(formData, "description"),
    taxableAmount:
      stringValue(formData, "taxableAmount").replace(",", ".") || undefined,
    vatAmount:
      stringValue(formData, "vatAmount").replace(",", ".") || undefined,
    amount: stringValue(formData, "amount").replace(",", "."),
    allocations: parseAllocations(formData),
  });
  const driveFileId = await maybeStoreFinancePdf(formData);
  const allocations = resolveAllocations(parsed.allocations, parsed.amount);

  const cost = await prisma.$transaction(async (tx) => {
    return tx.financeCost.create({
      data: {
        supplierId: parsed.supplierId || null,
        campaignId: parsed.campaignId || null,
        occurredOn: parsed.occurredOn,
        documentNumber: parsed.documentNumber || null,
        category: parsed.category,
        description: parsed.description,
        taxableAmount: parsed.taxableAmount ?? null,
        vatAmount: parsed.vatAmount ?? null,
        amount: parsed.amount,
        driveFileId,
        allocations: {
          create: allocations.map((allocation) => ({
            entryType: FinanceEntryType.COST,
            fieldGroupId: allocation.fieldGroupId,
            amount: allocation.amount,
            note: allocation.note,
          })),
        },
      },
    });
  });

  await writeAuditLog({
    actorUserId,
    action: "FINANCE_COST_CREATED",
    entityType: "FinanceCost",
    entityId: cost.id,
    after: cost,
  });

  revalidatePath("/finanza");
  revalidatePath("/finanza/costi");
  redirect(`/finanza/costi/${cost.id}`);
}

export async function updateFinanceCostAction(
  costId: string,
  formData: FormData,
) {
  const session = await requireUser();
  const actorUserId = session.user!.id;
  const before = await prisma.financeCost.findUnique({
    where: { id: costId },
    include: { allocations: true },
  });
  if (!before) throw new Error("Costo non trovato.");

  const parsed = financeCostSchema.parse({
    supplierId: stringValue(formData, "supplierId") || undefined,
    occurredOn: `${stringValue(formData, "occurredOn")}T00:00:00.000Z`,
    documentNumber: stringValue(formData, "documentNumber") || undefined,
    campaignId: stringValue(formData, "campaignId") || undefined,
    category: stringValue(formData, "category"),
    description: stringValue(formData, "description"),
    taxableAmount:
      stringValue(formData, "taxableAmount").replace(",", ".") || undefined,
    vatAmount:
      stringValue(formData, "vatAmount").replace(",", ".") || undefined,
    amount: stringValue(formData, "amount").replace(",", "."),
    allocations: parseAllocations(formData),
  });
  const driveFileId = await maybeStoreFinancePdf(formData, before.driveFileId);
  const allocations = resolveAllocations(parsed.allocations, parsed.amount);

  const cost = await prisma.$transaction(async (tx) => {
    await tx.financeAllocation.deleteMany({
      where: { financeCostId: costId },
    });
    return tx.financeCost.update({
      where: { id: costId },
      data: {
        supplierId: parsed.supplierId || null,
        campaignId: parsed.campaignId || null,
        occurredOn: parsed.occurredOn,
        documentNumber: parsed.documentNumber || null,
        category: parsed.category,
        description: parsed.description,
        taxableAmount: parsed.taxableAmount ?? null,
        vatAmount: parsed.vatAmount ?? null,
        amount: parsed.amount,
        driveFileId,
        allocations: {
          create: allocations.map((allocation) => ({
            entryType: FinanceEntryType.COST,
            fieldGroupId: allocation.fieldGroupId,
            amount: allocation.amount,
            note: allocation.note,
          })),
        },
      },
    });
  });

  await writeAuditLog({
    actorUserId,
    action: "FINANCE_COST_UPDATED",
    entityType: "FinanceCost",
    entityId: cost.id,
    before,
    after: cost,
  });

  revalidatePath("/finanza");
  revalidatePath("/finanza/costi");
  redirect(`/finanza/costi/${cost.id}`);
}

export async function createFinanceRevenueAction(formData: FormData) {
  const session = await requireUser();
  const actorUserId = session.user!.id;
  const parsed = financeRevenueSchema.parse({
    customerId: stringValue(formData, "customerId") || undefined,
    occurredOn: `${stringValue(formData, "occurredOn")}T00:00:00.000Z`,
    documentNumber: stringValue(formData, "documentNumber") || undefined,
    campaignId: stringValue(formData, "campaignId") || undefined,
    category: stringValue(formData, "category"),
    description: stringValue(formData, "description"),
    taxableAmount:
      stringValue(formData, "taxableAmount").replace(",", ".") || undefined,
    vatAmount:
      stringValue(formData, "vatAmount").replace(",", ".") || undefined,
    amount: stringValue(formData, "amount").replace(",", "."),
    allocations: parseAllocations(formData),
  });
  const driveFileId = await maybeStoreFinancePdf(formData);
  const allocations = resolveAllocations(parsed.allocations, parsed.amount);

  const revenue = await prisma.$transaction(async (tx) => {
    return tx.financeRevenue.create({
      data: {
        customerId: parsed.customerId || null,
        campaignId: parsed.campaignId || null,
        occurredOn: parsed.occurredOn,
        documentNumber: parsed.documentNumber || null,
        category: parsed.category,
        description: parsed.description,
        taxableAmount: parsed.taxableAmount ?? null,
        vatAmount: parsed.vatAmount ?? null,
        amount: parsed.amount,
        driveFileId,
        allocations: {
          create: allocations.map((allocation) => ({
            entryType: FinanceEntryType.REVENUE,
            fieldGroupId: allocation.fieldGroupId,
            amount: allocation.amount,
            note: allocation.note,
          })),
        },
      },
    });
  });

  await writeAuditLog({
    actorUserId,
    action: "FINANCE_REVENUE_CREATED",
    entityType: "FinanceRevenue",
    entityId: revenue.id,
    after: revenue,
  });

  revalidatePath("/finanza");
  revalidatePath("/finanza/ricavi");
  redirect(`/finanza/ricavi/${revenue.id}`);
}

export async function updateFinanceRevenueAction(
  revenueId: string,
  formData: FormData,
) {
  const session = await requireUser();
  const actorUserId = session.user!.id;
  const before = await prisma.financeRevenue.findUnique({
    where: { id: revenueId },
    include: { allocations: true },
  });
  if (!before) throw new Error("Ricavo non trovato.");

  const parsed = financeRevenueSchema.parse({
    customerId: stringValue(formData, "customerId") || undefined,
    occurredOn: `${stringValue(formData, "occurredOn")}T00:00:00.000Z`,
    documentNumber: stringValue(formData, "documentNumber") || undefined,
    campaignId: stringValue(formData, "campaignId") || undefined,
    category: stringValue(formData, "category"),
    description: stringValue(formData, "description"),
    taxableAmount:
      stringValue(formData, "taxableAmount").replace(",", ".") || undefined,
    vatAmount:
      stringValue(formData, "vatAmount").replace(",", ".") || undefined,
    amount: stringValue(formData, "amount").replace(",", "."),
    allocations: parseAllocations(formData),
  });
  const driveFileId = await maybeStoreFinancePdf(formData, before.driveFileId);
  const allocations = resolveAllocations(parsed.allocations, parsed.amount);

  const revenue = await prisma.$transaction(async (tx) => {
    await tx.financeAllocation.deleteMany({
      where: { financeRevenueId: revenueId },
    });
    return tx.financeRevenue.update({
      where: { id: revenueId },
      data: {
        customerId: parsed.customerId || null,
        campaignId: parsed.campaignId || null,
        occurredOn: parsed.occurredOn,
        documentNumber: parsed.documentNumber || null,
        category: parsed.category,
        description: parsed.description,
        taxableAmount: parsed.taxableAmount ?? null,
        vatAmount: parsed.vatAmount ?? null,
        amount: parsed.amount,
        driveFileId,
        allocations: {
          create: allocations.map((allocation) => ({
            entryType: FinanceEntryType.REVENUE,
            fieldGroupId: allocation.fieldGroupId,
            amount: allocation.amount,
            note: allocation.note,
          })),
        },
      },
    });
  });

  await writeAuditLog({
    actorUserId,
    action: "FINANCE_REVENUE_UPDATED",
    entityType: "FinanceRevenue",
    entityId: revenue.id,
    before,
    after: revenue,
  });

  revalidatePath("/finanza");
  revalidatePath("/finanza/ricavi");
  redirect(`/finanza/ricavi/${revenue.id}`);
}
