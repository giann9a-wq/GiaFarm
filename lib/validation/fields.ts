import { z } from "zod";

const decimalString = z
  .string()
  .trim()
  .min(1)
  .regex(/^\d+([.,]\d{1,2})?$/, "Inserire un numero con massimo 2 decimali.");

export const fieldFormSchema = z.object({
  municipality: z.string().trim().min(1, "Comune obbligatorio."),
  cadastralSheet: z.string().trim().min(1, "Foglio obbligatorio."),
  cadastralParcel: z.string().trim().min(1, "Mappale obbligatorio."),
  commonName: z.string().trim().optional(),
  cadastralAreaSqm: decimalString,
  notes: z.string().trim().optional()
});

export const fieldUsageHistorySchema = z.object({
  year: z.coerce.number().int().min(1900).max(2200),
  usedAreaSqm: decimalString,
  note: z.string().trim().optional()
});

export const fieldPacHistorySchema = z.object({
  year: z.coerce.number().int().min(1900).max(2200),
  included: z.enum(["unknown", "true", "false"]),
  note: z.string().trim().optional()
});

export function decimalInputToString(value: string) {
  return value.replace(",", ".").trim();
}
