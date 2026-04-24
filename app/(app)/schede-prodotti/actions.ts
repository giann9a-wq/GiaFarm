"use server";

import { DocumentModule } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/permissions";
import { upsertInlinePdf } from "@/lib/documents";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { productDocumentSchema } from "@/lib/validation/product-documents";

function stringValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function createProductDocumentAction(formData: FormData) {
  const session = await requireUser();
  const actorUserId = session.user!.id;
  const parsed = productDocumentSchema.parse({
    productMaterialId: stringValue(formData, "productMaterialId"),
    documentType: stringValue(formData, "documentType"),
    purchasedOn: `${stringValue(formData, "purchasedOn")}T00:00:00.000Z`,
    referenceNumber: stringValue(formData, "referenceNumber") || undefined,
    notes: stringValue(formData, "notes") || undefined,
  });

  const file = formData.get("pdf");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Carica un PDF per la scheda prodotto.");
  }

  const document = await prisma.$transaction(async (tx) => {
    const driveFile = await upsertInlinePdf(
      {
        file,
        module: DocumentModule.PRODUCTS,
      },
      tx,
    );

    return tx.productDocument.create({
      data: {
        productMaterialId: parsed.productMaterialId,
        driveFileId: driveFile.id,
        documentType: parsed.documentType,
        purchasedOn: parsed.purchasedOn,
        referenceNumber: parsed.referenceNumber || null,
        notes: parsed.notes || null,
      },
    });
  });

  await writeAuditLog({
    actorUserId,
    action: "PRODUCT_DOCUMENT_CREATED",
    entityType: "ProductDocument",
    entityId: document.id,
    after: document,
  });

  revalidatePath("/schede-prodotti");
  redirect("/schede-prodotti");
}
