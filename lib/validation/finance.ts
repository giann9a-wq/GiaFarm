import { z } from "zod";

const allocationRowSchema = z
  .object({
    fieldGroupId: z.string().optional(),
    amount: z.coerce.number().nonnegative().optional(),
    percentage: z.coerce.number().min(0).max(100).optional(),
    note: z.string().max(300).optional(),
  })
  .refine(
    (value) =>
      value.fieldGroupId || (!value.amount && !value.percentage && !value.note),
    {
      message: "Se compili una riga di allocazione devi selezionare un gruppo.",
    },
  );

const baseFinanceEntrySchema = z.object({
  occurredOn: z.coerce.date(),
  documentNumber: z.string().max(120).optional(),
  campaignId: z.string().optional(),
  category: z.string().min(1, "La categoria e' obbligatoria.").max(120),
  description: z.string().min(1, "La descrizione e' obbligatoria.").max(1000),
  taxableAmount: z.coerce.number().nonnegative().optional(),
  vatAmount: z.coerce.number().nonnegative().optional(),
  amount: z.coerce.number().positive("L'importo totale deve essere positivo."),
  allocations: z.array(allocationRowSchema).default([]),
});

export const financeCostSchema = baseFinanceEntrySchema.extend({
  supplierId: z.string().optional(),
});

export const financeRevenueSchema = baseFinanceEntrySchema.extend({
  customerId: z.string().optional(),
});
