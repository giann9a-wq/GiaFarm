import { z } from "zod";

export const productDocumentSchema = z.object({
  productMaterialId: z.string().min(1, "Seleziona un prodotto."),
  documentType: z.string().min(1, "Indica la tipologia documento."),
  purchasedOn: z.coerce.date(),
  referenceNumber: z.string().max(120).optional(),
  notes: z.string().max(1000).optional(),
});
