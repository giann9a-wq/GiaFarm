import { OutboundDdtKind } from "@prisma/client";
import { z } from "zod";

const optionalDecimal = z
  .string()
  .trim()
  .optional()
  .transform((value) => value?.replace(",", ".") || undefined)
  .refine((value) => value === undefined || /^\d+(\.\d{1,3})?$/.test(value), {
    message: "Inserire un numero positivo con massimo 3 decimali."
  });

export const inboundDeliveryFormSchema = z.object({
  supplierId: z.string().min(1),
  number: z.string().trim().min(1),
  issuedOn: z.coerce.date(),
  internalRecipient: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  attachmentName: z.string().trim().optional(),
  attachmentDriveFileId: z.string().trim().optional(),
  attachmentUrl: z.string().trim().url().optional().or(z.literal("").transform(() => undefined)),
  rows: z
    .array(
      z.object({
        productMaterialId: z.string().optional(),
        articleCode: z.string().trim().optional(),
        description: z.string().trim().optional(),
        registrationNumber: z.string().trim().optional(),
        quantity: optionalDecimal.refine((value) => value !== undefined && Number(value) > 0, {
          message: "La quantita' deve essere positiva."
        }),
        unit: z.string().trim().min(1),
        unitPrice: optionalDecimal,
        lineAmount: optionalDecimal,
        ciCode: z.string().trim().optional(),
        lot: z.string().trim().optional(),
        notes: z.string().trim().optional()
      }).refine((row) => row.articleCode || row.description || row.productMaterialId, {
        message: "Inserire almeno codice articolo o descrizione."
      })
    )
    .min(1)
});

export const outboundDdtFormSchema = z.object({
  kind: z.nativeEnum(OutboundDdtKind),
  issuedOn: z.coerce.date(),
  customerId: z.string().optional(),
  customerName: z.string().trim().optional(),
  destinationName: z.string().trim().optional(),
  destinationAddress: z.string().trim().optional(),
  transportReason: z.string().trim().optional(),
  packageAppearance: z.string().trim().optional(),
  packageCount: z.string().trim().optional(),
  transportedBy: z.string().trim().optional(),
  transportStartsAt: z.coerce.date().optional(),
  driverSignature: z.string().trim().optional(),
  recipientSignature: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  rows: z
    .array(
      z.object({
        productMaterialId: z.string().optional(),
        description: z.string().trim().min(1),
        quantity: optionalDecimal.refine((value) => value !== undefined && Number(value) > 0, {
          message: "La quantita' deve essere positiva."
        }),
        unit: z.string().trim().min(1),
        lot: z.string().trim().optional(),
        notes: z.string().trim().optional()
      })
    )
    .min(1)
});
