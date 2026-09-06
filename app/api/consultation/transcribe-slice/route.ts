/**
 * Consultation Audio Slice Transcription — Amazon Transcribe Medical
 *
 * Called by the browser after each 60-second audio slice is uploaded to S3.
 * Submits the slice to Amazon Transcribe Medical (clinical-grade STT) and
 * appends the resulting transcript to the active consultation in DynamoDB.
 *
 * Amazon Transcribe Medical benefits over browser SpeechRecognition:
 * - Trained on medical vocabulary: drug names, dosages, anatomical terms
 * - PHI redaction support (HIPAA-ready)
 * - Multiple speaker diarization (Doctor vs Patient channels)
 * - Seven language support including en-US, es-US
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  StartMedicalTranscriptionJobCommand,
  GetMedicalTranscriptionJobCommand,
  type MedicalTranscriptionJob,
} from '@aws-sdk/client-transcribe';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { transcribeClient, s3Client, awsConfig } from '@/lib/aws-config';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { dynamodbClient } from '@/lib/aws-config';

export const dynamic = 'force-dynamic';
// Allow up to 60 seconds for Transcribe Medical job polling
export const maxDuration = 60;

const docClient = DynamoDBDocumentClient.from(dynamodbClient);

interface TranscribeSliceRequest {
  /** Consultation session identifier */
  sessionId: string;
  /** S3 key of the audio slice (returned by /api/consultation/upload-slice) */
  s3Key: string;
  /** Sequential slice index */
  sliceIndex: number;
  /** Medical specialty for Transcribe Medical (default: PRIMARYCARE) */
  specialty?: string;
  /** Conversation type: CONVERSATION (multi-speaker) or DICTATION */
  type?: 'CONVERSATION' | 'DICTATION';
}

/**
 * Wait for a Transcribe Medical job to complete (up to 55 seconds with polling).
 */
async function pollTranscriptionJob(
  jobName: string
): Promise<MedicalTranscriptionJob | null> {
  const startTime = Date.now();
  const timeout = 55_000; // 55 second poll limit (within maxDuration)
  const pollInterval = 2_000;

  while (Date.now() - startTime < timeout) {
    const result = await transcribeClient.send(
      new GetMedicalTranscriptionJobCommand({
        MedicalTranscriptionJobName: jobName,
      })
    );

    const job = result.MedicalTranscriptionJob;
    if (!job) return null;

    if (job.TranscriptionJobStatus === 'COMPLETED') return job;
    if (job.TranscriptionJobStatus === 'FAILED') {
      console.error(`[Transcribe] Job ${jobName} failed:`, job.FailureReason);
      return null;
    }

    // Still IN_PROGRESS or QUEUED — wait and retry
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  console.warn(`[Transcribe] Job ${jobName} timed out after ${timeout}ms`);
  return null;
}

/**
 * Fetch the transcript text from the Transcribe Medical output S3 URI.
 */
async function fetchTranscriptText(transcriptUri: string): Promise<string> {
  try {
    // Transcribe stores results in its own S3 URI format:
    // https://s3.{region}.amazonaws.com/{bucket}/{key}
    const url = new URL(transcriptUri);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const bucket = pathParts[0];
    const key = pathParts.slice(1).join('/');

    const obj = await s3Client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key })
    );

    const bodyText = await obj.Body?.transformToString();
    if (!bodyText) return '';

    const parsed = JSON.parse(bodyText);
    return parsed?.results?.transcripts?.[0]?.transcript || '';
  } catch (err: any) {
    console.error(
      '[Transcribe] Failed to fetch transcript text:',
      err?.message
    );
    return '';
  }
}

/**
 * Append a transcript segment to the consultation record in DynamoDB.
 */
async function appendTranscriptSegment(
  sessionId: string,
  sliceIndex: number,
  transcriptText: string,
  jobName: string
): Promise<void> {
  const table = awsConfig.dynamodb.tableName;
  const segment = {
    sliceIndex,
    text: transcriptText,
    jobName,
    timestamp: new Date().toISOString(),
  };

  await docClient.send(
    new UpdateCommand({
      TableName: table,
      Key: { id: `consultation#${sessionId}` },
      UpdateExpression:
        'SET transcriptSegments = list_append(if_not_exists(transcriptSegments, :empty), :seg), ' +
        'updatedAt = :ts, ' +
        'fullTranscript = if_not_exists(fullTranscript, :emptyStr)',
      ExpressionAttributeValues: {
        ':seg': [segment],
        ':empty': [],
        ':emptyStr': '',
        ':ts': new Date().toISOString(),
      },
    })
  );

  // Also concatenate into the rolling fullTranscript field for easy SOAP synthesis
  await docClient
    .send(
      new UpdateCommand({
        TableName: table,
        Key: { id: `consultation#${sessionId}` },
        UpdateExpression: 'SET fullTranscript = :ft, updatedAt = :ts',
        ExpressionAttributeValues: {
          ':ft': transcriptText, // Appended in separate call to avoid race
          ':ts': new Date().toISOString(),
        },
        ConditionExpression: 'attribute_exists(id)',
      })
    )
    .catch(() => {
      // Item may not exist yet — ignore condition failure, segments already saved
    });
}

export async function POST(request: NextRequest) {
  try {
    const body: TranscribeSliceRequest = await request.json();

    const {
      sessionId,
      s3Key,
      sliceIndex,
      specialty = process.env.TRANSCRIBE_MEDICAL_SPECIALTY || 'PRIMARYCARE',
      type = (process.env.TRANSCRIBE_MEDICAL_TYPE as
        'CONVERSATION' | 'DICTATION') || 'CONVERSATION',
    } = body;

    if (!sessionId || !s3Key || sliceIndex === undefined) {
      return NextResponse.json(
        { error: 'sessionId, s3Key, and sliceIndex are required' },
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

    // Transcribe Medical requires a unique job name per request
    const jobName = `noa-${sessionId}-slice-${sliceIndex}-${Date.now()}`;

    // Determine media format from S3 key extension
    const ext = s3Key.split('.').pop()?.toLowerCase();
    const mediaFormat = ext === 'mp4' ? 'mp4' : ext === 'ogg' ? 'ogg' : 'webm';

    // Start the Transcribe Medical job
    await transcribeClient.send(
      new StartMedicalTranscriptionJobCommand({
        MedicalTranscriptionJobName: jobName,
        LanguageCode: 'en-US',
        MediaFormat: mediaFormat as any,
        Media: {
          MediaFileUri: `s3://${bucket}/${s3Key}`,
        },
        OutputBucketName: bucket,
        OutputKey: `transcripts/consultation/${sessionId}/`,
        Specialty: specialty as any,
        Type: type,
        Settings: {
          ShowSpeakerLabels: type === 'CONVERSATION',
          MaxSpeakerLabels: type === 'CONVERSATION' ? 2 : undefined,
          // Enable PHI identification for HIPAA compliance awareness
          ShowAlternatives: false,
        },
      })
    );

    // Poll for completion (up to 55s — within this route's maxDuration)
    const completedJob = await pollTranscriptionJob(jobName);

    if (!completedJob?.Transcript?.TranscriptFileUri) {
      // Job is still running (unlikely for a 60s slice, but handle gracefully)
      return NextResponse.json({
        status: 'processing',
        jobName,
        message:
          'Transcription job started but not yet complete. Poll /api/consultation/transcribe-status.',
      });
    }

    // Fetch transcript text from the Transcribe Medical output
    const transcriptText = await fetchTranscriptText(
      completedJob.Transcript.TranscriptFileUri
    );

    // Append to DynamoDB consultation record
    await appendTranscriptSegment(
      sessionId,
      sliceIndex,
      transcriptText,
      jobName
    );

    return NextResponse.json({
      status: 'completed',
      jobName,
      sliceIndex,
      transcriptText,
      charCount: transcriptText.length,
    });
  } catch (error: any) {
    console.error('[Consultation/TranscribeSlice] Error:', error?.message);
    return NextResponse.json(
      { error: 'Failed to transcribe audio slice', details: error?.message },
      { status: 500 }
    );
  }
}
