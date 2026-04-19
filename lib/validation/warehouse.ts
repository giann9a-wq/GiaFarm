import { z } from "zod";

export const warehouseAdjustmentSchema = z.object({
  productMaterialId: z.string().min(1),
  quantity: z.coerce.number().refine((value) => value !== 0, {
    message: "La rettifica deve essere diversa da zero."
  }),
  unit: z.string().min(1).max(16),
  movedOn: z.coerce.date(),
  reason: z.string().min(10, "La nota e' obbligatoria e deve spiegare la rettifica.")
});
