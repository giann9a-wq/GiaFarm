import { z } from "zod";

export const warehouseAdjustmentSchema = z.object({
  productMaterialId: z.string().min(1),
  quantity: z.coerce.number().refine((value) => value !== 0, {
    message: "La rettifica deve essere diversa da zero.",
  }),
  unit: z.string().min(1).max(16),
  movedOn: z.coerce.date(),
  reason: z
    .string()
    .min(10, "La nota e' obbligatoria e deve spiegare la rettifica."),
});

export const productMaterialUpdateSchema = z.object({
  name: z.string().min(1, "Il nome materiale e' obbligatorio.").max(160),
  code: z.string().max(80).optional(),
  category: z.string().min(1, "La categoria e' obbligatoria.").max(120),
  unit: z.string().min(1, "L'unita' di misura e' obbligatoria.").max(16),
  active: z.boolean(),
  notes: z.string().max(1000).optional(),
});
