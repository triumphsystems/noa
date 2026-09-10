import { z } from 'zod';

export const doctorProfileUpdateSchema = z
  .object({
    name: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    specialty: z.string().trim().optional(),
    clinic: z.string().trim().optional(),
    address: z.string().trim().optional(),
    bio: z.string().trim().optional(),
    avatar: z.string().trim().optional(),
    license: z.string().trim().optional(),
    issuingAuthority: z.string().trim().optional(),
    licenseDocumentUrl: z.string().trim().optional(),
    verificationStatus: z.enum(['pending', 'verified', 'rejected']).optional(),
    rejectionReason: z.string().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one profile field is required',
  });

export type DoctorProfileUpdateSchemaInput = z.infer<
  typeof doctorProfileUpdateSchema
>;

export const doctorConnectSchema = z
  .object({
    doctorId: z.string().trim().optional(),
    careCode: z.string().trim().optional(),
  })
  .refine((data) => Boolean(data.doctorId || data.careCode), {
    message: 'Either doctorId or careCode is required',
  });

export type DoctorConnectInput = z.infer<typeof doctorConnectSchema>;

export const doctorLinkActionSchema = z.object({
  patientId: z
    .string({ error: 'patientId is required' })
    .trim()
    .min(1, 'patientId is required'),
  action: z.enum(['accept', 'decline'] as const, {
    error: 'Valid action (accept or decline) is required',
  }),
});

export type DoctorLinkActionInput = z.infer<typeof doctorLinkActionSchema>;
