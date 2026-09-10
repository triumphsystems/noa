import { z } from 'zod';

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

export const transcribeSliceSchema = z.object({
  sessionId: z
    .string({ required_error: 'Session ID is required' })
    .trim()
    .min(1, 'Session ID is required'),
  s3Key: z
    .string({ required_error: 'S3 key is required' })
    .trim()
    .min(1, 'S3 key is required'),
  sliceIndex: z.number({ required_error: 'Slice index is required' }),
  specialty: z.string().optional(),
  type: z.enum(['CONVERSATION', 'DICTATION']).optional(),
});

export type TranscribeSliceInput = z.infer<typeof transcribeSliceSchema>;

