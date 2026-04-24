import { z } from "zod";

export const manualCalendarEventSchema = z.object({
  title: z.string().min(1, "Il titolo e' obbligatorio.").max(160),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().optional(),
  allDay: z.boolean(),
  eventType: z.string().max(80).optional(),
  campaignId: z.string().optional(),
  fieldGroupId: z.string().optional(),
  notes: z.string().max(1000).optional(),
});
