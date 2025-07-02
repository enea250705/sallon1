import { z } from 'zod';

// Schema di validazione per i giorni straordinari
export const salonExtraordinaryDaySchema = z.object({
  date: z.string(),
  reason: z.string().min(1, "La motivazione è richiesta"),
  isClosed: z.boolean().default(true),
  specialOpenTime: z.string().nullable(),
  specialCloseTime: z.string().nullable(),
  notes: z.string().nullable(),
}); 