"use server";

import {
  DocumentModule,
  OutboundDdtKind,
  Prisma,
  WarehouseMovementSource,
  WarehouseMovementType,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/permissions";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import {
  inboundDeliveryFormSchema,
  outboundDdtFormSchema,
} from "@/lib/validation/delivery";
import {
  assertAvailableStock,
  rebuildWarehouseBalances,
  recordWarehouseMovement,
} from "@/lib/warehouse/stock";

function stringValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function dateValue(formData: FormData, key: string) {
  return `${stringValue(formData, key)}T00:00:00.000Z`;
}

function optionalDateTimeValue(formData: FormData, key: string) {
  const value = stringValue(formData, key);
  return value ? new Date(value) : undefined;
}

function parseRows(formData: FormData, prefix: string, maxRows = 5) {
  return Array.from({ length: maxRows }, (_, index) => {
    const productMaterialId = stringValue(
      formData,
      `${prefix}.${index}.productMaterialId`,
    );
    const articleCode = stringValue(formData, `${prefix}.${index}.articleCode`);
    const description = stringValue(formData, `${prefix}.${index}.description`);
    const registrationNumber = stringValue(
      formData,
      `${prefix}.${index}.registrationNumber`,
    );
    const quantity = stringValue(formData, `${prefix}.${index}.quantity`);
    const unit = stringValue(formData, `${prefix}.${index}.unit`);
    const unitPrice = stringValue(formData, `${prefix}.${index}.unitPrice`);
    const lineAmount = stringValue(formData, `${prefix}.${index}.lineAmount`);
    const ciCode = stringValue(formData, `${prefix}.${index}.ciCode`);
    const lot = stringValue(formData, `${prefix}.${index}.lot`);
    const notes = stringValue(formData, `${prefix}.${index}.notes`);
    return {
      productMaterialId: productMaterialId || undefined,
      articleCode: articleCode || undefined,
      description: description || undefined,
      registrationNumber: registrationNumber || undefined,
      quantity: quantity || undefined,
      unit,
      unitPrice: unitPrice || undefined,
      lineAmount: lineAmount || undefined,
      ciCode: ciCode || undefined,
      lot: lot || undefined,
      notes: notes || undefined,
    };
  }).filter(
    (row) =>
      row.productMaterialId ||
      row.articleCode ||
      row.description ||
      row.quantity,
  );
}

async function upsertDriveFile(input: {
  driveFileId?: string;
  name?: string;
  url?: string;
  module: DocumentModule;
  fallbackKey: string;
}) {
  if (!input.driveFileId && !input.name && !input.url) return null;

  const googleDriveFileId = input.driveFileId || input.fallbackKey;
  return prisma.driveFile.upsert({
    where: { googleDriveFileId },
    update: {
      name: input.name || "Documento allegato",
      mimeType: "application/pdf",
      module: input.module,
      webViewLink: input.url || null,
    },
    create: {
      googleDriveFileId,
      name: input.name || "Documento allegato",
      mimeType: "application/pdf",
      module: input.module,
      webViewLink: input.url || null,
    },
  });
}

export async function createInboundDeliveryNoteAction(formData: FormData) {
  const session = await requireUser();
  const actorUserId = session.user!.id;
  const parsed = inboundDeliveryFormSchema.parse({
    supplierId: stringValue(formData, "supplierId"),
    number: stringValue(formData, "number"),
    issuedOn: dateValue(formData, "issuedOn"),
    internalRecipient: stringValue(formData, "internalRecipient") || undefined,
    notes: stringValue(formData, "notes") || undefined,
    attachmentName: stringValue(formData, "attachmentName") || undefined,
    attachmentDriveFileId:
      stringValue(formData, "attachmentDriveFileId") || undefined,
    attachmentUrl: stringValue(formData, "attachmentUrl") || undefined,
    rows: parseRows(formData, "rows"),
  });

  const driveFile = await upsertDriveFile({
    driveFileId: parsed.attachmentDriveFileId,
    name: parsed.attachmentName,
    url: parsed.attachmentUrl,
    module: DocumentModule.INBOUND_DDT,
    fallbackKey: `manual-inbound-${parsed.number}-${Date.now()}`,
  });

  const note = await prisma.$transaction(async (tx) => {
    const inbound = await tx.inboundDeliveryNote.create({
      data: {
        supplierId: parsed.supplierId,
        number: parsed.number,
        issuedOn: parsed.issuedOn,
        receivedOn: new Date(),
        internalRecipient: parsed.internalRecipient || null,
        status: "ISSUED",
        notes: parsed.notes || null,
        driveFileId: driveFile?.id || null,
      },
    });

    const rows = [];
    for (const row of parsed.rows) {
      const productMaterial = row.productMaterialId
        ? await tx.productMaterial.findUniqueOrThrow({
            where: { id: row.productMaterialId },
          })
        : await tx.productMaterial.upsert({
            where: {
              name: row.description || row.articleCode || "Materiale bolla",
            },
            update: {
              code: row.articleCode || undefined,
              unit: row.unit,
              active: true,
            },
            create: {
              name: row.description || row.articleCode || "Materiale bolla",
              code: row.articleCode || null,
              category: "Materiale da bolla",
              unit: row.unit,
              notes: "Creato automaticamente da bolla in ingresso.",
            },
          });
      const inboundRow = await tx.inboundDeliveryRow.create({
        data: {
          inboundDeliveryNoteId: inbound.id,
          productMaterialId: productMaterial.id,
          articleCode: row.articleCode || null,
          description: row.description || null,
          registrationNumber: row.registrationNumber || null,
          quantity: row.quantity!,
          unit: row.unit,
          unitPrice: row.unitPrice || null,
          lineAmount: row.lineAmount || null,
          ciCode: row.ciCode || null,
          lot: row.lot || null,
          notes: row.notes || null,
        },
      });
      rows.push(inboundRow);
      await recordWarehouseMovement(
        {
          productMaterialId: inboundRow.productMaterialId,
          movementType: WarehouseMovementType.IN,
          source: WarehouseMovementSource.BOLLA_IN,
          sourceId: inbound.id,
          inboundDeliveryRowId: inboundRow.id,
          actorUserId,
          quantity: inboundRow.quantity,
          unit: inboundRow.unit,
          movedOn: parsed.issuedOn,
          lot: inboundRow.lot,
          note: `Bolla ingresso ${inbound.number}`,
        },
        tx,
      );
    }

    return { ...inbound, rows };
  });

  await writeAuditLog({
    actorUserId,
    action: "INBOUND_DELIVERY_NOTE_CREATED",
    entityType: "InboundDeliveryNote",
    entityId: note.id,
    after: note,
  });

  revalidatePath("/bolle-ddt");
  revalidatePath("/magazzino");
  redirect(`/bolle-ddt/bolle/${note.id}`);
}

async function syncInboundRows(input: {
  tx: Prisma.TransactionClient;
  inboundId: string;
  rows: Array<{
    productMaterialId?: string;
    articleCode?: string;
    description?: string;
    registrationNumber?: string;
    quantity?: string;
    unit: string;
    unitPrice?: string;
    lineAmount?: string;
    ciCode?: string;
    lot?: string;
    notes?: string;
  }>;
  issuedOn: Date;
  number: string;
  actorUserId: string;
}) {
  await input.tx.warehouseMovement.deleteMany({
    where: {
      sourceId: input.inboundId,
      source: WarehouseMovementSource.BOLLA_IN,
    },
  });
  await input.tx.inboundDeliveryRow.deleteMany({
    where: { inboundDeliveryNoteId: input.inboundId },
  });
  for (const row of input.rows) {
    const productMaterial = row.productMaterialId
      ? await input.tx.productMaterial.findUniqueOrThrow({
          where: { id: row.productMaterialId },
        })
      : await input.tx.productMaterial.upsert({
          where: {
            name: row.description || row.articleCode || "Materiale bolla",
          },
          update: {
            code: row.articleCode || undefined,
            unit: row.unit,
            active: true,
          },
          create: {
            name: row.description || row.articleCode || "Materiale bolla",
            code: row.articleCode || null,
            category: "Materiale da bolla",
            unit: row.unit,
            notes: "Creato automaticamente da bolla in ingresso.",
          },
        });
    const inboundRow = await input.tx.inboundDeliveryRow.create({
      data: {
        inboundDeliveryNoteId: input.inboundId,
        productMaterialId: productMaterial.id,
        articleCode: row.articleCode || null,
        description: row.description || null,
        registrationNumber: row.registrationNumber || null,
        quantity: row.quantity!,
        unit: row.unit,
        unitPrice: row.unitPrice || null,
        lineAmount: row.lineAmount || null,
        ciCode: row.ciCode || null,
        lot: row.lot || null,
        notes: row.notes || null,
      },
    });
    await recordWarehouseMovement(
      {
        productMaterialId: inboundRow.productMaterialId,
        movementType: WarehouseMovementType.IN,
        source: WarehouseMovementSource.BOLLA_IN,
        sourceId: input.inboundId,
        inboundDeliveryRowId: inboundRow.id,
        actorUserId: input.actorUserId,
        quantity: inboundRow.quantity,
        unit: inboundRow.unit,
        movedOn: input.issuedOn,
        lot: inboundRow.lot,
        note: `Bolla ingresso ${input.number}`,
      },
      input.tx,
    );
  }
}

export async function updateInboundDeliveryNoteAction(
  noteId: string,
  formData: FormData,
) {
  const session = await requireUser();
  const actorUserId = session.user!.id;
  const parsed = inboundDeliveryFormSchema.parse({
    supplierId: stringValue(formData, "supplierId"),
    number: stringValue(formData, "number"),
    issuedOn: dateValue(formData, "issuedOn"),
    internalRecipient: stringValue(formData, "internalRecipient") || undefined,
    notes: stringValue(formData, "notes") || undefined,
    attachmentName: stringValue(formData, "attachmentName") || undefined,
    attachmentDriveFileId:
      stringValue(formData, "attachmentDriveFileId") || undefined,
    attachmentUrl: stringValue(formData, "attachmentUrl") || undefined,
    rows: parseRows(formData, "rows"),
  });
  const before = await prisma.inboundDeliveryNote.findUnique({
    where: { id: noteId },
    include: { rows: true },
  });
  const updated = await prisma.$transaction(async (tx) => {
    const note = await tx.inboundDeliveryNote.update({
      where: { id: noteId },
      data: {
        supplierId: parsed.supplierId,
        number: parsed.number,
        issuedOn: parsed.issuedOn,
        internalRecipient: parsed.internalRecipient || null,
        notes: parsed.notes || null,
      },
    });
    await syncInboundRows({
      tx,
      inboundId: note.id,
      rows: parsed.rows,
      issuedOn: parsed.issuedOn,
      number: parsed.number,
      actorUserId,
    });
    await rebuildWarehouseBalances(tx);
    return note;
  });
  await writeAuditLog({
    actorUserId,
    action: "INBOUND_DELIVERY_NOTE_UPDATED",
    entityType: "InboundDeliveryNote",
    entityId: noteId,
    before,
    after: updated,
  });
  revalidatePath("/bolle-ddt");
  revalidatePath("/magazzino");
  redirect(`/bolle-ddt/bolle/${noteId}`);
}

export async function createBusinessPartnerAction(formData: FormData) {
  const session = await requireUser();
  const businessName = stringValue(formData, "businessName");
  if (!businessName) throw new Error("Il nome anagrafica e' obbligatorio.");
  const isSupplier = formData.get("isSupplier") === "on";
  const isCustomer = formData.get("isCustomer") === "on";
  if (!isSupplier && !isCustomer) {
    throw new Error("Selezionare almeno Fornitore o Destinatario DDT.");
  }
  let supplier = null;
  let customer = null;
  if (isSupplier) {
    supplier = await prisma.supplier.create({
      data: {
        businessName,
        vatNumber: stringValue(formData, "vatNumber") || null,
        taxCode: stringValue(formData, "taxCode") || null,
        email: stringValue(formData, "email") || null,
        phone: stringValue(formData, "phone") || null,
        notes: stringValue(formData, "notes") || null,
      },
    });
  }
  if (isCustomer) {
    customer = await prisma.customer.create({
      data: {
        businessName,
        vatNumber: stringValue(formData, "vatNumber") || null,
        taxCode: stringValue(formData, "taxCode") || null,
        email: stringValue(formData, "email") || null,
        phone: stringValue(formData, "phone") || null,
        address: stringValue(formData, "address") || null,
        notes: stringValue(formData, "notes") || null,
      },
    });
  }

  await writeAuditLog({
    actorUserId: session.user?.id,
    action: "BUSINESS_PARTNER_CREATED",
    entityType: "BusinessPartner",
    entityId: supplier?.id ?? customer?.id,
    after: { supplier, customer },
  });

  revalidatePath("/bolle-ddt");
  revalidatePath("/bolle-ddt/anagrafiche");
  revalidatePath("/bolle-ddt/bolle/nuova");
  revalidatePath("/bolle-ddt/ddt/nuovo");
  redirect("/bolle-ddt/anagrafiche");
}

export async function updateSupplierAction(
  supplierId: string,
  formData: FormData,
) {
  const session = await requireUser();
  const before = await prisma.supplier.findUnique({
    where: { id: supplierId },
  });
  const supplier = await prisma.supplier.update({
    where: { id: supplierId },
    data: {
      businessName: stringValue(formData, "businessName"),
      vatNumber: stringValue(formData, "vatNumber") || null,
      taxCode: stringValue(formData, "taxCode") || null,
      email: stringValue(formData, "email") || null,
      phone: stringValue(formData, "phone") || null,
      notes: stringValue(formData, "notes") || null,
    },
  });
  await writeAuditLog({
    actorUserId: session.user?.id,
    action: "SUPPLIER_UPDATED",
    entityType: "Supplier",
    entityId: supplier.id,
    before,
    after: supplier,
  });
  revalidatePath("/bolle-ddt");
  revalidatePath("/bolle-ddt/anagrafiche");
  revalidatePath("/bolle-ddt/bolle/nuova");
  redirect("/bolle-ddt/anagrafiche");
}

export async function updateCustomerAction(
  customerId: string,
  formData: FormData,
) {
  const session = await requireUser();
  const before = await prisma.customer.findUnique({
    where: { id: customerId },
  });
  const customer = await prisma.customer.update({
    where: { id: customerId },
    data: {
      businessName: stringValue(formData, "businessName"),
      vatNumber: stringValue(formData, "vatNumber") || null,
      taxCode: stringValue(formData, "taxCode") || null,
      email: stringValue(formData, "email") || null,
      phone: stringValue(formData, "phone") || null,
      address: stringValue(formData, "address") || null,
      notes: stringValue(formData, "notes") || null,
    },
  });
  await writeAuditLog({
    actorUserId: session.user?.id,
    action: "CUSTOMER_UPDATED",
    entityType: "Customer",
    entityId: customer.id,
    before,
    after: customer,
  });
  revalidatePath("/bolle-ddt");
  revalidatePath("/bolle-ddt/anagrafiche");
  revalidatePath("/bolle-ddt/ddt/nuovo");
  redirect("/bolle-ddt/anagrafiche");
}

export async function createDdtDestinationAction(formData: FormData) {
  const session = await requireUser();
  const name = stringValue(formData, "name");
  if (!name) throw new Error("Il nome destinazione e' obbligatorio.");

  const destination = await prisma.ddtDestination.create({
    data: {
      customerId: stringValue(formData, "customerId") || null,
      name,
      address: stringValue(formData, "address") || null,
      notes: stringValue(formData, "notes") || null,
    },
  });

  await writeAuditLog({
    actorUserId: session.user?.id,
    action: "DDT_DESTINATION_CREATED",
    entityType: "DdtDestination",
    entityId: destination.id,
    after: destination,
  });

  revalidatePath("/bolle-ddt/anagrafiche");
  revalidatePath("/bolle-ddt/ddt/nuovo");
  redirect("/bolle-ddt/anagrafiche");
}

export async function updateDdtDestinationAction(
  destinationId: string,
  formData: FormData,
) {
  const session = await requireUser();
  const before = await prisma.ddtDestination.findUnique({
    where: { id: destinationId },
  });
  const destination = await prisma.ddtDestination.update({
    where: { id: destinationId },
    data: {
      customerId: stringValue(formData, "customerId") || null,
      name: stringValue(formData, "name"),
      address: stringValue(formData, "address") || null,
      notes: stringValue(formData, "notes") || null,
    },
  });
  await writeAuditLog({
    actorUserId: session.user?.id,
    action: "DDT_DESTINATION_UPDATED",
    entityType: "DdtDestination",
    entityId: destination.id,
    before,
    after: destination,
  });
  revalidatePath("/bolle-ddt/anagrafiche");
  revalidatePath("/bolle-ddt/ddt/nuovo");
  redirect("/bolle-ddt/anagrafiche");
}

async function nextDdtNumber(issuedOn: Date) {
  const year = issuedOn.getUTCFullYear();
  const sequence = await prisma.ddtNumberSequence.upsert({
    where: { year },
    update: { nextValue: { increment: 1 } },
    create: { year, nextValue: 2 },
  });
  const sequenceNumber = sequence.nextValue - 1;
  return {
    year,
    sequenceNumber,
    number: `${String(sequenceNumber).padStart(4, "0")}/${year}`,
  };
}

export async function createOutboundDdtAction(formData: FormData) {
  const session = await requireUser();
  const actorUserId = session.user!.id;
  const parsed = outboundDdtFormSchema.parse({
    kind: stringValue(formData, "kind"),
    issuedOn: dateValue(formData, "issuedOn"),
    customerId: stringValue(formData, "customerId") || undefined,
    customerName: stringValue(formData, "customerName") || undefined,
    destinationName: stringValue(formData, "destinationName") || undefined,
    destinationAddress:
      stringValue(formData, "destinationAddress") || undefined,
    transportReason: stringValue(formData, "transportReason") || undefined,
    packageAppearance: stringValue(formData, "packageAppearance") || undefined,
    packageCount: stringValue(formData, "packageCount") || undefined,
    transportedBy: stringValue(formData, "transportedBy") || undefined,
    transportStartsAt: optionalDateTimeValue(formData, "transportStartsAt"),
    driverSignature: stringValue(formData, "driverSignature") || undefined,
    recipientSignature:
      stringValue(formData, "recipientSignature") || undefined,
    notes: stringValue(formData, "notes") || undefined,
    rows: parseRows(formData, "rows"),
  });

  if (parsed.kind === OutboundDdtKind.WAREHOUSE) {
    for (const row of parsed.rows) {
      if (!row.productMaterialId) {
        throw new Error(
          "Nei DDT da magazzino ogni riga deve selezionare un materiale.",
        );
      }
      await assertAvailableStock({
        productMaterialId: row.productMaterialId,
        quantity: row.quantity!,
        lot: row.lot,
        label: row.description,
      });
    }
  }

  if (parsed.kind === OutboundDdtKind.FREE_TEXT) {
    for (const row of parsed.rows) {
      if (!row.description) {
        throw new Error("Nei DDT free text la descrizione e' obbligatoria.");
      }
    }
  }

  const numbering = await nextDdtNumber(parsed.issuedOn);
  const ddt = await prisma.$transaction(async (tx) => {
    let customerId = parsed.customerId || null;
    if (!customerId && parsed.customerName) {
      const customer = await tx.customer.create({
        data: { businessName: parsed.customerName },
      });
      customerId = customer.id;
    }

    const customer = customerId
      ? await tx.customer.findUnique({ where: { id: customerId } })
      : null;
    const destination =
      parsed.destinationName || parsed.destinationAddress
        ? await tx.ddtDestination.create({
            data: {
              customerId,
              name:
                parsed.destinationName ||
                parsed.destinationAddress ||
                "Destinazione",
              address: parsed.destinationAddress || null,
            },
          })
        : null;

    const outbound = await tx.outboundDdt.create({
      data: {
        kind: parsed.kind,
        customerId,
        destinationId: destination?.id || null,
        number: numbering.number,
        sequenceYear: numbering.year,
        sequenceNumber: numbering.sequenceNumber,
        issuedOn: parsed.issuedOn,
        status: "ISSUED",
        senderHeading: "GiaFarm",
        recipientSnapshot: customer
          ? {
              businessName: customer.businessName,
              taxCode: customer.taxCode,
              vatNumber: customer.vatNumber,
              address: customer.address,
              email: customer.email,
              phone: customer.phone,
            }
          : parsed.customerName
            ? { businessName: parsed.customerName }
            : undefined,
        destinationText:
          [parsed.destinationName, parsed.destinationAddress]
            .filter(Boolean)
            .join(" - ") || null,
        transportReason: parsed.transportReason || null,
        packageAppearance: parsed.packageAppearance || null,
        packageCount: parsed.packageCount || null,
        transportedBy: parsed.transportedBy || null,
        transportStartsAt: parsed.transportStartsAt,
        driverSignature: parsed.driverSignature || null,
        recipientSignature: parsed.recipientSignature || null,
        notes: parsed.notes || null,
        rows: {
          create: parsed.rows.map((row) => ({
            productMaterial:
              parsed.kind === OutboundDdtKind.WAREHOUSE && row.productMaterialId
                ? { connect: { id: row.productMaterialId } }
                : undefined,
            description: row.description,
            quantity: row.quantity!,
            unit: row.unit,
            lot: row.lot || null,
            notes: row.notes || null,
          })),
        },
      },
      include: { rows: true },
    });

    if (parsed.kind === OutboundDdtKind.WAREHOUSE) {
      for (const row of outbound.rows) {
        if (!row.productMaterialId) continue;
        await recordWarehouseMovement(
          {
            productMaterialId: row.productMaterialId,
            movementType: WarehouseMovementType.OUT,
            source: WarehouseMovementSource.DDT_OUT,
            sourceId: outbound.id,
            outboundDdtRowId: row.id,
            actorUserId,
            quantity: row.quantity,
            unit: row.unit,
            movedOn: parsed.issuedOn,
            lot: row.lot,
            note: `DDT ${outbound.number}`,
          },
          tx,
        );
      }
    }

    return outbound;
  });

  await writeAuditLog({
    actorUserId,
    action: "OUTBOUND_DDT_CREATED",
    entityType: "OutboundDdt",
    entityId: ddt.id,
    after: ddt,
  });

  revalidatePath("/bolle-ddt");
  revalidatePath("/magazzino");
  redirect(`/bolle-ddt/ddt/${ddt.id}`);
}

async function syncOutboundRows(input: {
  tx: Prisma.TransactionClient;
  ddtId: string;
  kind: OutboundDdtKind;
  rows: Array<{
    productMaterialId?: string;
    description?: string;
    quantity?: string;
    unit: string;
    lot?: string;
    notes?: string;
  }>;
  issuedOn: Date;
  number: string;
  actorUserId: string;
}) {
  await input.tx.warehouseMovement.deleteMany({
    where: { sourceId: input.ddtId, source: WarehouseMovementSource.DDT_OUT },
  });
  await input.tx.outboundDdtRow.deleteMany({
    where: { outboundDdtId: input.ddtId },
  });
  for (const row of input.rows) {
    const ddtRow = await input.tx.outboundDdtRow.create({
      data: {
        outboundDdtId: input.ddtId,
        productMaterialId:
          input.kind === OutboundDdtKind.WAREHOUSE
            ? row.productMaterialId
            : null,
        description: row.description || "",
        quantity: row.quantity!,
        unit: row.unit,
        lot: row.lot || null,
        notes: row.notes || null,
      },
    });
    if (input.kind === OutboundDdtKind.WAREHOUSE && ddtRow.productMaterialId) {
      await recordWarehouseMovement(
        {
          productMaterialId: ddtRow.productMaterialId,
          movementType: WarehouseMovementType.OUT,
          source: WarehouseMovementSource.DDT_OUT,
          sourceId: input.ddtId,
          outboundDdtRowId: ddtRow.id,
          actorUserId: input.actorUserId,
          quantity: ddtRow.quantity,
          unit: ddtRow.unit,
          movedOn: input.issuedOn,
          lot: ddtRow.lot,
          note: `DDT ${input.number}`,
        },
        input.tx,
      );
    }
  }
}

export async function updateOutboundDdtAction(
  ddtId: string,
  formData: FormData,
) {
  const session = await requireUser();
  const actorUserId = session.user!.id;
  const parsed = outboundDdtFormSchema.parse({
    kind: stringValue(formData, "kind"),
    issuedOn: dateValue(formData, "issuedOn"),
    customerId: stringValue(formData, "customerId") || undefined,
    customerName: stringValue(formData, "customerName") || undefined,
    destinationName: stringValue(formData, "destinationName") || undefined,
    destinationAddress:
      stringValue(formData, "destinationAddress") || undefined,
    transportReason: stringValue(formData, "transportReason") || undefined,
    packageAppearance: stringValue(formData, "packageAppearance") || undefined,
    packageCount: stringValue(formData, "packageCount") || undefined,
    transportedBy: stringValue(formData, "transportedBy") || undefined,
    transportStartsAt: optionalDateTimeValue(formData, "transportStartsAt"),
    driverSignature: stringValue(formData, "driverSignature") || undefined,
    recipientSignature:
      stringValue(formData, "recipientSignature") || undefined,
    notes: stringValue(formData, "notes") || undefined,
    rows: parseRows(formData, "rows"),
  });
  const before = await prisma.outboundDdt.findUnique({
    where: { id: ddtId },
    include: { rows: true },
  });
  const updated = await prisma.$transaction(async (tx) => {
    let customerId = parsed.customerId || null;
    if (!customerId && parsed.customerName) {
      const customer = await tx.customer.create({
        data: { businessName: parsed.customerName },
      });
      customerId = customer.id;
    }
    const customer = customerId
      ? await tx.customer.findUnique({ where: { id: customerId } })
      : null;
    const destination =
      parsed.destinationName || parsed.destinationAddress
        ? await tx.ddtDestination.create({
            data: {
              customerId,
              name:
                parsed.destinationName ||
                parsed.destinationAddress ||
                "Destinazione",
              address: parsed.destinationAddress || null,
            },
          })
        : null;
    const ddt = await tx.outboundDdt.update({
      where: { id: ddtId },
      data: {
        kind: parsed.kind,
        customerId,
        destinationId: destination?.id || null,
        issuedOn: parsed.issuedOn,
        recipientSnapshot: customer
          ? {
              businessName: customer.businessName,
              taxCode: customer.taxCode,
              vatNumber: customer.vatNumber,
              address: customer.address,
              email: customer.email,
              phone: customer.phone,
            }
          : parsed.customerName
            ? { businessName: parsed.customerName }
            : undefined,
        destinationText:
          [parsed.destinationName, parsed.destinationAddress]
            .filter(Boolean)
            .join(" - ") || null,
        transportReason: parsed.transportReason || null,
        packageAppearance: parsed.packageAppearance || null,
        packageCount: parsed.packageCount || null,
        transportedBy: parsed.transportedBy || null,
        transportStartsAt: parsed.transportStartsAt,
        driverSignature: parsed.driverSignature || null,
        recipientSignature: parsed.recipientSignature || null,
        notes: parsed.notes || null,
      },
    });
    await syncOutboundRows({
      tx,
      ddtId,
      kind: parsed.kind,
      rows: parsed.rows,
      issuedOn: parsed.issuedOn,
      number: ddt.number,
      actorUserId,
    });
    await rebuildWarehouseBalances(tx);
    return ddt;
  });
  await writeAuditLog({
    actorUserId,
    action: "OUTBOUND_DDT_UPDATED",
    entityType: "OutboundDdt",
    entityId: ddtId,
    before,
    after: updated,
  });
  revalidatePath("/bolle-ddt");
  revalidatePath("/magazzino");
  redirect(`/bolle-ddt/ddt/${ddtId}`);
}
