"use server";

import {
  DocumentModule,
  OutboundDdtKind,
  WarehouseMovementSource,
  WarehouseMovementType
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/permissions";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { inboundDeliveryFormSchema, outboundDdtFormSchema } from "@/lib/validation/delivery";
import { assertAvailableStock, recordWarehouseMovement } from "@/lib/warehouse/stock";

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
    const productMaterialId = stringValue(formData, `${prefix}.${index}.productMaterialId`);
    const articleCode = stringValue(formData, `${prefix}.${index}.articleCode`);
    const description = stringValue(formData, `${prefix}.${index}.description`);
    const registrationNumber = stringValue(formData, `${prefix}.${index}.registrationNumber`);
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
      notes: notes || undefined
    };
  }).filter((row) => row.productMaterialId || row.articleCode || row.description || row.quantity);
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
      webViewLink: input.url || null
    },
    create: {
      googleDriveFileId,
      name: input.name || "Documento allegato",
      mimeType: "application/pdf",
      module: input.module,
      webViewLink: input.url || null
    }
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
    attachmentDriveFileId: stringValue(formData, "attachmentDriveFileId") || undefined,
    attachmentUrl: stringValue(formData, "attachmentUrl") || undefined,
    rows: parseRows(formData, "rows")
  });

  const driveFile = await upsertDriveFile({
    driveFileId: parsed.attachmentDriveFileId,
    name: parsed.attachmentName,
    url: parsed.attachmentUrl,
    module: DocumentModule.INBOUND_DDT,
    fallbackKey: `manual-inbound-${parsed.number}-${Date.now()}`
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
        driveFileId: driveFile?.id || null
      }
    });

    const rows = [];
    for (const row of parsed.rows) {
      const productMaterial = row.productMaterialId
        ? await tx.productMaterial.findUniqueOrThrow({ where: { id: row.productMaterialId } })
        : await tx.productMaterial.upsert({
            where: { name: row.description || row.articleCode || "Materiale bolla" },
            update: {
              code: row.articleCode || undefined,
              unit: row.unit,
              active: true
            },
            create: {
              name: row.description || row.articleCode || "Materiale bolla",
              code: row.articleCode || null,
              category: "Materiale da bolla",
              unit: row.unit,
              notes: "Creato automaticamente da bolla in ingresso."
            }
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
          notes: row.notes || null
        }
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
          note: `Bolla ingresso ${inbound.number}`
        },
        tx
      );
    }

    return { ...inbound, rows };
  });

  await writeAuditLog({
    actorUserId,
    action: "INBOUND_DELIVERY_NOTE_CREATED",
    entityType: "InboundDeliveryNote",
    entityId: note.id,
    after: note
  });

  revalidatePath("/bolle-ddt");
  revalidatePath("/magazzino");
  redirect(`/bolle-ddt/bolle/${note.id}`);
}

export async function createSupplierAction(formData: FormData) {
  const session = await requireUser();
  const businessName = stringValue(formData, "businessName");
  if (!businessName) throw new Error("Il nome fornitore e' obbligatorio.");

  const supplier = await prisma.supplier.create({
    data: {
      businessName,
      vatNumber: stringValue(formData, "vatNumber") || null,
      taxCode: stringValue(formData, "taxCode") || null,
      email: stringValue(formData, "email") || null,
      phone: stringValue(formData, "phone") || null,
      notes: stringValue(formData, "notes") || null
    }
  });

  await writeAuditLog({
    actorUserId: session.user?.id,
    action: "SUPPLIER_CREATED",
    entityType: "Supplier",
    entityId: supplier.id,
    after: supplier
  });

  revalidatePath("/bolle-ddt");
  revalidatePath("/bolle-ddt/anagrafiche");
  revalidatePath("/bolle-ddt/bolle/nuova");
  redirect("/bolle-ddt/anagrafiche");
}

export async function createCustomerAction(formData: FormData) {
  const session = await requireUser();
  const businessName = stringValue(formData, "businessName");
  if (!businessName) throw new Error("Il nome destinatario e' obbligatorio.");

  const customer = await prisma.customer.create({
    data: {
      businessName,
      vatNumber: stringValue(formData, "vatNumber") || null,
      taxCode: stringValue(formData, "taxCode") || null,
      email: stringValue(formData, "email") || null,
      phone: stringValue(formData, "phone") || null,
      address: stringValue(formData, "address") || null,
      notes: stringValue(formData, "notes") || null
    }
  });

  await writeAuditLog({
    actorUserId: session.user?.id,
    action: "CUSTOMER_CREATED",
    entityType: "Customer",
    entityId: customer.id,
    after: customer
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
      notes: stringValue(formData, "notes") || null
    }
  });

  await writeAuditLog({
    actorUserId: session.user?.id,
    action: "DDT_DESTINATION_CREATED",
    entityType: "DdtDestination",
    entityId: destination.id,
    after: destination
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
    create: { year, nextValue: 2 }
  });
  const sequenceNumber = sequence.nextValue - 1;
  return {
    year,
    sequenceNumber,
    number: `${String(sequenceNumber).padStart(4, "0")}/${year}`
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
    destinationAddress: stringValue(formData, "destinationAddress") || undefined,
    transportReason: stringValue(formData, "transportReason") || undefined,
    packageAppearance: stringValue(formData, "packageAppearance") || undefined,
    packageCount: stringValue(formData, "packageCount") || undefined,
    transportedBy: stringValue(formData, "transportedBy") || undefined,
    transportStartsAt: optionalDateTimeValue(formData, "transportStartsAt"),
    driverSignature: stringValue(formData, "driverSignature") || undefined,
    recipientSignature: stringValue(formData, "recipientSignature") || undefined,
    notes: stringValue(formData, "notes") || undefined,
    rows: parseRows(formData, "rows")
  });

  if (parsed.kind === OutboundDdtKind.WAREHOUSE) {
    for (const row of parsed.rows) {
      if (!row.productMaterialId) {
        throw new Error("Nei DDT da magazzino ogni riga deve selezionare un materiale.");
      }
      await assertAvailableStock({
        productMaterialId: row.productMaterialId,
        quantity: row.quantity!,
        lot: row.lot,
        label: row.description
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
        data: { businessName: parsed.customerName }
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
              name: parsed.destinationName || parsed.destinationAddress || "Destinazione",
              address: parsed.destinationAddress || null
            }
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
              phone: customer.phone
            }
          : parsed.customerName
            ? { businessName: parsed.customerName }
            : undefined,
        destinationText: [parsed.destinationName, parsed.destinationAddress]
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
            notes: row.notes || null
          }))
        }
      },
      include: { rows: true }
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
            note: `DDT ${outbound.number}`
          },
          tx
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
    after: ddt
  });

  revalidatePath("/bolle-ddt");
  revalidatePath("/magazzino");
  redirect(`/bolle-ddt/ddt/${ddt.id}`);
}
