import { z } from 'zod';

export const intakeSubmitSchema = z.object({
  patientId: z.string().trim().optional(),
  doctorId: z
    .string({ error: 'doctorId is required' })
    .trim()
    .min(1, 'doctorId is required'),
  chiefComplaint: z.string().trim().optional(),
  summary: z.string().trim().optional(),
  medicalHistory: z.string().trim().optional(),
  medications: z.array(z.string().trim()).optional(),
  allergies: z.array(z.string().trim()).optional(),
  surgeries: z.string().trim().optional(),
  familyHistory: z.string().trim().optional(),
  socialHistory: z.string().trim().optional(),
});

export type IntakeSubmitInput = z.infer<typeof intakeSubmitSchema>;

export const intakeConversationMessageSchema = z.object({
  role: z.enum(['assistant', 'patient', 'system'] as const),
  content: z.string(),
  timestamp: z.number(),
});

export const intakeConversationTurnSchema = z.object({
  transcript: z
    .string({ error: 'transcript is required' })
    .trim()
    .min(1, 'transcript is required'),
  language: z.string().trim().optional(),
  history: z.array(intakeConversationMessageSchema).optional(),
  draft: z.record(z.string(), z.unknown()).optional(),
  doctorId: z.string().trim().optional(),
  intakeId: z.string().trim().optional(),
});

export type IntakeConversationTurnInput = z.infer<
  typeof intakeConversationTurnSchema
>;
