import { z } from 'zod';

export const sessionCreateOrUpdateSchema = z.object({
  doctorId: z
    .string({ error: 'doctorId is required' })
    .trim()
    .min(1, 'doctorId is required'),
  patientId: z
    .string({ error: 'patientId is required' })
    .trim()
    .min(1, 'patientId is required'),
  transcript: z.string().optional(),
  soapNote: z.record(z.string(), z.unknown()).optional(),
  sessionId: z.string().trim().optional(),
  id: z.string().trim().optional(),
});

export type SessionCreateOrUpdateInput = z.infer<
  typeof sessionCreateOrUpdateSchema
>;
