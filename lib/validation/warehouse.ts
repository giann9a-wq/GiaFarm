import { z } from "zod";

export const warehouseAdjustmentSchema = z.object({
  productMaterialId: z.string().min(1),
  quantity: z.coerce.number(),
  unit: z.string().min(1).max(16),
  movedOn: z.coerce.date(),
  reason: z.string().min(10, "La nota e' obbligatoria e deve spiegare la rettifica.")
});
