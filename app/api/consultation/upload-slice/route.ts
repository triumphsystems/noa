/**
 * Consultation Audio Slice Upload — Presigned S3 URL Generator
 *
 * Architecture: Rolling 60-second ambient scribe for 30+ minute doctor-patient consultations.
 *
 * Flow:
 *   Browser (MediaRecorder, 60s slices)
 *     → POST /api/consultation/upload-slice  (gets presigned S3 URL, ≤50ms)
 *     → PUT audio/webm directly to S3        (browser → S3, bypasses Vercel)
 *     → POST /api/consultation/transcribe-slice (triggers Transcribe Medical)
 *
 * Benefits over a persistent WebSocket for long consultations:
 * - No Vercel function timeouts (each request is <1s)
 * - Fault tolerant: browser buffers slice and retries on network hiccup
 * - HIPAA-compliant: audio archived in encrypted S3 automatically
 * - Scales to any consultation length (45 min, 60 min, 90 min)
 */

import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, awsConfig } from '@/lib/aws-config';

export const dynamic = 'force-dynamic';

interface UploadSliceRequest {
  /** Unique consultation session identifier */
  sessionId: string;
  /** Sequential slice index (0, 1, 2, ...) */
  sliceIndex: number;
  /** Audio MIME type — browser MediaRecorder format (e.g. 'audio/webm;codecs=opus') */
  mimeType?: string;
  /** Doctor ID for routing and audit */
  doctorId?: string;
  /** Patient ID for routing and audit */
  patientId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: UploadSliceRequest = await request.json();

    const {
      sessionId,
      sliceIndex,
      mimeType = 'audio/webm',
      doctorId,
      patientId,
    } = body;

    if (!sessionId || sliceIndex === undefined || sliceIndex < 0) {
      return NextResponse.json(
        { error: 'sessionId and a non-negative sliceIndex are required' },
        { status: 400 }
      );
    }

    const bucket = awsConfig.s3.bucket;
    if (!bucket) {
      return NextResponse.json(
        { error: 'S3_BUCKET not configured' },
        { status: 500 }
      );
    }

    // Determine file extension from MIME type
    const ext = mimeType.includes('ogg')
      ? 'ogg'
      : mimeType.includes('mp4')
        ? 'mp4'
        : 'webm';

    // S3 key: consultation/<sessionId>/<sliceIndex>.<ext>
    const s3Key = `${awsConfig.s3.prefixes.audio}consultation/${sessionId}/${String(sliceIndex).padStart(4, '0')}.${ext}`;

    // Generate a presigned URL valid for 5 minutes
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: s3Key,
      ContentType: mimeType,
      // Tag slices with session metadata for lifecycle management and audit
      Tagging: [
        `sessionId=${sessionId}`,
        doctorId ? `doctorId=${doctorId}` : '',
        patientId ? `patientId=${patientId}` : '',
        `sliceIndex=${sliceIndex}`,
      ]
        .filter(Boolean)
        .join('&'),
    });

    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 300, // 5 minutes
    });

    return NextResponse.json({
      uploadUrl: presignedUrl,
      s3Key,
      expiresIn: 300,
    });
  } catch (error: any) {
    console.error(
      '[Consultation/UploadSlice] Error generating presigned URL:',
      error?.message
    );
    return NextResponse.json(
      { error: 'Failed to generate upload URL', details: error?.message },
      { status: 500 }
    );
  }
}
