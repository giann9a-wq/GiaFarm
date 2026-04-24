import crypto from "node:crypto";
import { DocumentModule, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type InlinePdfInput = {
  file: File;
  module: DocumentModule;
  existingDriveFileId?: string | null;
};

function ensurePdf(file: File) {
  if (!file || file.size === 0) {
    throw new Error("Seleziona un file PDF da caricare.");
  }
  const mimeType = file.type || "application/pdf";
  if (mimeType !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Sono supportati solo file PDF.");
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new Error("Il PDF supera il limite di 12 MB.");
  }
}

export async function upsertInlinePdf(
  input: InlinePdfInput,
  client: Prisma.TransactionClient | typeof prisma = prisma
) {
  ensurePdf(input.file);

  const arrayBuffer = await input.file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const payload = {
    name: input.file.name || "documento.pdf",
    mimeType: "application/pdf",
    module: input.module,
    inlineDataBase64: buffer.toString("base64"),
    sizeBytes: BigInt(buffer.byteLength),
    uploadedAt: new Date()
  };

  if (input.existingDriveFileId) {
    return client.driveFile.update({
      where: { id: input.existingDriveFileId },
      data: payload
    });
  }

  return client.driveFile.create({
    data: {
      googleDriveFileId: `inline-${crypto.randomUUID()}`,
      ...payload
    }
  });
}
