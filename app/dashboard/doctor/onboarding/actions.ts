'use server';

import { revalidatePath } from 'next/cache';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { nanoid } from 'nanoid';
import { requireServerAuth } from '@/lib/auth/server';
import { getDoctorById, updateDoctor } from '@/lib/db';
import { s3Client } from '@/lib/aws-config';
import type { Doctor } from '@/lib/db/types';

export interface LicensureActionResult {
  success: boolean;
  message?: string;
  error?: string;
  doctor?: Doctor;
}

export type SubmitLicensureInput =
  | FormData
  | {
      license: string;
      issuingAuthority: string;
      name?: string;
      specialty?: string;
      clinic?: string;
      phone?: string;
      licenseDocumentUrl?: string;
      file?: File | null;
    };

/**
 * Server Action to submit medical licensure and practice credentials for verification.
 * Validates license number and issuing authority, updates status to pending, and revalidates /dashboard/doctor.
 */
export async function submitLicensure(
  input: SubmitLicensureInput
): Promise<LicensureActionResult> {
  try {
    const auth = await requireServerAuth(['doctor']);
    const doctorId = auth.sub;

    const doctor = await getDoctorById(doctorId);
    if (!doctor) {
      return { success: false, error: 'Doctor profile not found' };
    }

    let license = '';
    let issuingAuthority = '';
    let name: string | undefined;
    let specialty: string | undefined;
    let clinic: string | undefined;
    let phone: string | undefined;
    let directUrl: string | undefined;
    let file: File | null = null;

    if (input instanceof FormData) {
      license = ((input.get('license') as string) || '').trim();
      issuingAuthority = (
        (input.get('issuingAuthority') as string) || ''
      ).trim();
      name = ((input.get('name') as string) || '').trim() || undefined;
      specialty =
        ((input.get('specialty') as string) || '').trim() || undefined;
      clinic = ((input.get('clinic') as string) || '').trim() || undefined;
      phone = ((input.get('phone') as string) || '').trim() || undefined;
      directUrl =
        (input.get('licenseDocumentUrl') as string) ||
        (input.get('documentUrl') as string) ||
        '' ||
        undefined;

      const rawFile = input.get('file');
      if (rawFile && typeof rawFile === 'object' && 'size' in rawFile) {
        file = rawFile as File;
      }
    } else {
      license = (input.license || '').trim();
      issuingAuthority = (input.issuingAuthority || '').trim();
      name = input.name?.trim();
      specialty = input.specialty?.trim();
      clinic = input.clinic?.trim();
      phone = input.phone?.trim();
      directUrl = input.licenseDocumentUrl?.trim();
      file = input.file || null;
    }

    if (!license) {
      return {
        success: false,
        error: 'Please enter your medical license number.',
      };
    }

    if (!issuingAuthority) {
      return {
        success: false,
        error:
          'Please specify the issuing medical licensing authority or board.',
      };
    }

    let finalDocumentUrl = directUrl || doctor.licenseDocumentUrl || '';

    // Handle document upload if file provided
    if (file && file.size > 0) {
      if (file.size > 10 * 1024 * 1024) {
        return {
          success: false,
          error:
            'File size exceeds 10MB limit. Please upload a smaller PDF or image.',
        };
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const fileExt = file.name.split('.').pop() || 'pdf';
      const s3Key = `licenses/${doctorId}/${nanoid()}.${fileExt}`;
      const s3Bucket = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET;

      if (s3Bucket) {
        try {
          await s3Client.send(
            new PutObjectCommand({
              Bucket: s3Bucket,
              Key: s3Key,
              Body: buffer,
              ContentType: file.type || 'application/pdf',
            })
          );
          finalDocumentUrl = `https://${s3Bucket}.s3.amazonaws.com/${s3Key}`;
        } catch (s3Err) {
          console.warn('[Onboarding] S3 upload failed, falling back:', s3Err);
          if (file.size <= 300 * 1024) {
            finalDocumentUrl = `data:${file.type || 'application/pdf'};base64,${buffer.toString('base64')}`;
          } else {
            finalDocumentUrl = `document://${s3Key}`;
          }
        }
      } else {
        if (file.size <= 300 * 1024) {
          finalDocumentUrl = `data:${file.type || 'application/pdf'};base64,${buffer.toString('base64')}`;
        } else {
          finalDocumentUrl = `document://${s3Key}`;
        }
      }
    }

    const updated = await updateDoctor(doctorId, {
      license,
      issuingAuthority,
      verificationStatus: 'pending',
      ...(name ? { name } : {}),
      ...(specialty ? { specialty } : {}),
      ...(clinic ? { clinic } : {}),
      ...(phone ? { phone } : {}),
      ...(finalDocumentUrl ? { licenseDocumentUrl: finalDocumentUrl } : {}),
      updatedAt: Date.now(),
    });

    if (!updated) {
      return { success: false, error: 'Failed to update credentials' };
    }

    revalidatePath('/dashboard/doctor');
    revalidatePath('/dashboard/doctor/onboarding');
    revalidatePath('/dashboard/doctor/settings');

    return {
      success: true,
      message:
        'Credentials submitted successfully. Your application is now queued for clinical administration review.',
      doctor: updated,
    };
  } catch (error) {
    console.error('[Actions] Failed to submit licensure:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to submit licensure credentials',
    };
  }
}

export const submitLicensureAction = submitLicensure;
