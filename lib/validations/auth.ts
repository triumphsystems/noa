import { z } from 'zod';
import { ROLES } from '@/lib/auth/roles';

export const loginSchema = z.object({
  email: z
    .string({ error: 'Email is required' })
    .trim()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z
    .string({ error: 'Password is required' })
    .min(1, 'Password is required'),
  userType: z.enum(ROLES).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  email: z
    .string({ error: 'Email is required' })
    .trim()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z
    .string({ error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters long.'),
  firstName: z
    .string({ error: 'First name is required' })
    .trim()
    .min(1, 'First name is required'),
  lastName: z
    .string({ error: 'Last name is required' })
    .trim()
    .min(1, 'Last name is required'),
  userType: z.enum(['doctor', 'patient'] as const, {
    error: 'Invalid user type. Must be doctor or patient.',
  }),
  specialty: z.string().trim().optional(),
  clinic: z.string().trim().optional(),
  doctorId: z.string().trim().optional(),
  license: z.string().trim().optional(),
  issuingAuthority: z.string().trim().optional(),
  licenseDocumentUrl: z.string().trim().optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;

export const verifyCodeSchema = z.object({
  email: z
    .string({ error: 'Email is required' })
    .trim()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  code: z
    .string({ error: 'Verification code is required' })
    .trim()
    .min(1, 'Verification code is required'),
});

export type VerifyCodeInput = z.infer<typeof verifyCodeSchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .string({ error: 'Email is required' })
    .trim()
    .min(1, 'Email address is required')
    .email('Invalid email address'),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  email: z
    .string({ error: 'Email is required' })
    .trim()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  code: z
    .string({ error: 'Verification code is required' })
    .trim()
    .min(1, 'Verification code is required'),
  newPassword: z
    .string({ error: 'New password is required' })
    .min(6, 'Password must be at least 6 characters long'),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
