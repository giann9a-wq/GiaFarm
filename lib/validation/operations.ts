import { z } from "zod";

const optionalDecimal = z
  .string()
  .trim()
  .optional()
  .transform((value) => value?.replace(",", ".") || undefined)
  .refine((value) => value === undefined || /^\d+(\.\d{1,4})?$/.test(value), {
    message: "Inserire un numero positivo con massimo 4 decimali."
  });

export const operationFormSchema = z.object({
  campaignId: z.string().min(1),
  operationTypeId: z.string().min(1),
  performedOn: z.coerce.date(),
  fieldGroupId: z.string().optional(),
  fieldIds: z.array(z.string()).default([]),
  productMaterialId: z.string().optional(),
  quantity: optionalDecimal,
  quantityUnit: z.string().trim().optional(),
  treatedAreaHa: optionalDecimal,
  treatmentReason: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  attachmentName: z.string().trim().optional(),
  attachmentDriveFileId: z.string().trim().optional(),
  attachmentUrl: z.string().trim().url().optional().or(z.literal("").transform(() => undefined))
});

export const fieldGroupFormSchema = z.object({
  campaignId: z.string().min(1),
  name: z.string().trim().min(1),
  cropId: z.string().optional(),
  startsOn: z.coerce.date().optional(),
  endsOn: z.coerce.date().optional(),
  fieldIds: z.array(z.string()).default([]),
  notes: z.string().trim().optional()
});
