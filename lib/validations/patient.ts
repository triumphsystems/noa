import { z } from 'zod';

export const patientInviteSchema = z.object({
  email: z
    .string({ required_error: 'Patient email is required' })
    .trim()
    .min(1, 'Patient email is required')
    .email('Invalid email address'),
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  phone: z.string().trim().optional(),
});

export type PatientInviteInput = z.infer<typeof patientInviteSchema>;

export const patientLinkActionSchema = z.object({
  action: z.enum(['accept', 'decline'], {
    errorMap: () => ({ message: 'Valid action (accept or decline) is required' }),
  }),
});

export type PatientLinkActionInput = z.infer<typeof patientLinkActionSchema>;

export const patientProfileUpdateSchema = z
  .object({
    avatar: z.string().optional(),
    phone: z.string().trim().optional(),
    gender: z.string().trim().optional(),
    dateOfBirth: z.string().trim().optional(),
    address: z.string().trim().optional(),
    allergies: z.array(z.string().trim()).optional(),
    medications: z.array(z.string().trim()).optional(),
    conditions: z.array(z.string().trim()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required for update',
  });

export type PatientProfileUpdateInput = z.infer<typeof patientProfileUpdateSchema>;
