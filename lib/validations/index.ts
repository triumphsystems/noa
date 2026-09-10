import { z } from 'zod';
import { ROLES } from '@/lib/auth/roles';

// ==========================================
// Auth Schemas
// ==========================================

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required'),
  userType: z.enum(ROLES).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z
    .string({ required_error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters long.'),
  firstName: z
    .string({ required_error: 'First name is required' })
    .trim()
    .min(1, 'First name is required'),
  lastName: z
    .string({ required_error: 'Last name is required' })
    .trim()
    .min(1, 'Last name is required'),
  userType: z.enum(['doctor', 'patient'], {
    errorMap: () => ({ message: 'Invalid user type. Must be doctor or patient.' }),
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
    .string({ required_error: 'Email is required' })
    .trim()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  code: z
    .string({ required_error: 'Verification code is required' })
    .trim()
    .min(1, 'Verification code is required'),
});

export type VerifyCodeInput = z.infer<typeof verifyCodeSchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .min(1, 'Email address is required')
    .email('Invalid email address'),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .trim()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  code: z
    .string({ required_error: 'Verification code is required' })
    .trim()
    .min(1, 'Verification code is required'),
  newPassword: z
    .string({ required_error: 'New password is required' })
    .min(6, 'Password must be at least 6 characters long'),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// ==========================================
// Clinical Schemas
// ==========================================

export const soapGenerateSchema = z.object({
  transcript: z
    .string({ required_error: 'Transcript is required' })
    .trim()
    .min(1, 'Transcript is required'),
  patientInfo: z.string().optional(),
  sessionId: z.string().optional(),
});

export type SoapGenerateInput = z.infer<typeof soapGenerateSchema>;

export const triageGenerateSchema = z.object({
  chiefComplaint: z
    .string({ required_error: 'Chief complaint is required' })
    .trim()
    .min(1, 'Chief complaint is required'),
  symptoms: z.any().refine((val) => {
    if (typeof val === 'string') return val.trim().length > 0;
    if (Array.isArray(val)) return val.length > 0;
    return Boolean(val);
  }, { message: 'Chief complaint and symptoms are required' }),
  vitalSigns: z.record(z.unknown()).optional(),
});

export type TriageGenerateInput = z.infer<typeof triageGenerateSchema>;

export const suggestionsGenerateSchema = z.object({
  transcript: z
    .string({ required_error: 'Transcript is required' })
    .trim()
    .min(1, 'Transcript is required'),
  sessionId: z.string().optional(),
  patientHistory: z.string().optional(),
  currentSymptoms: z.string().optional(),
});

export type SuggestionsGenerateInput = z.infer<typeof suggestionsGenerateSchema>;

export const summaryGenerateSchema = z.object({
  soapNote: z
    .any({ required_error: 'SOAP note is required' })
    .refine((val) => Boolean(val), { message: 'SOAP note is required' }),
  clinicalTerms: z.array(z.string()).optional(),
});

export type SummaryGenerateInput = z.infer<typeof summaryGenerateSchema>;

export const insightsGenerateSchema = z.object({
  patientHistory: z.string().optional(),
  currentPresentation: z
    .string({ required_error: 'Current presentation is required' })
    .trim()
    .min(1, 'Current presentation is required'),
  previousFindings: z.string().optional(),
  medications: z.array(z.string()).optional(),
  procedures: z.string().optional(),
});

export type InsightsGenerateInput = z.infer<typeof insightsGenerateSchema>;

// ==========================================
// Doctor Schemas
// ==========================================

export const doctorProfileUpdateSchema = z.object({
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
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one profile field is required',
});

export type DoctorProfileUpdateSchemaInput = z.infer<typeof doctorProfileUpdateSchema>;

