import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { nanoid } from 'nanoid';

import { s3Client } from '@/lib/aws-config';
import { getDoctorById, updateDoctor } from '@/lib/db';
import { requireAuth } from '@/lib/auth/guard';
import { apiError, apiSuccess, handleApiError } from '@/lib/api/response';
import { API_ERROR_CODES } from '@/lib/types/api.types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const guard = await requireAuth(request);
    if (!guard.ok) return guard.response;
    const { auth } = guard;

    const { id } = await params;
    if (!id) {
      return apiError(API_ERROR_CODES.VALIDATION_ERROR, 'Doctor ID is required', 400);
    }

    if (id !== auth.sub && auth.userType !== 'admin') {
      return apiError(API_ERROR_CODES.FORBIDDEN, 'Forbidden', 403);
    }

    const doctor = await getDoctorById(id);
    if (!doctor) {
      return apiError(API_ERROR_CODES.NOT_FOUND, 'Doctor not found', 404);
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const directUrl = formData.get('documentUrl') as string | null;

    let finalDocumentUrl = directUrl || '';

    if (file && file.size > 0) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return apiError(API_ERROR_CODES.VALIDATION_ERROR, 'File size exceeds 10MB limit', 400);
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const fileExt = file.name.split('.').pop() || 'pdf';
      const s3Key = `licenses/${id}/${nanoid()}.${fileExt}`;
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
          console.warn(
            '[Onboarding] S3 upload failed, falling back to data URL:',
            s3Err
          );
          // Fallback to data URL for local dev or offline mode if file is reasonable size (< 300KB)
          if (file.size <= 300 * 1024) {
            finalDocumentUrl = `data:${file.type || 'application/pdf'};base64,${buffer.toString('base64')}`;
          } else {
            finalDocumentUrl = `document://${s3Key}`;
          }
        }
      } else {
        // Dev fallback
        if (file.size <= 300 * 1024) {
          finalDocumentUrl = `data:${file.type || 'application/pdf'};base64,${buffer.toString('base64')}`;
        } else {
          finalDocumentUrl = `document://${s3Key}`;
        }
      }
    }

    if (!finalDocumentUrl) {
      return apiError(API_ERROR_CODES.VALIDATION_ERROR, 'No file or document URL provided', 400);
    }

    // Update doctor record with the license document URL
    const updated = await updateDoctor(id, {
      licenseDocumentUrl: finalDocumentUrl,
    });

    return apiSuccess({
      message: 'License document uploaded successfully',
      licenseDocumentUrl: finalDocumentUrl,
      doctor: updated,
    });
  } catch (error) {
    return handleApiError(error, 'Failed to upload license document');
  }
}
