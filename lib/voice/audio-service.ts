import {
  ConverseCommand,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { bedrockClient, s3Client, awsConfig } from '../aws-config';

// Nova 2 Sonic model ID
const SONIC_MODEL =
  process.env.BEDROCK_SONIC_MODEL || 'amazon.nova-2-sonic-v1:0';

export function detectAudioFormat(
  buffer: Buffer
): 'wav' | 'mp3' | 'ogg' | 'flac' {
  if (buffer.length >= 4) {
    if (
      buffer[0] === 0x52 &&
      buffer[1] === 0x49 &&
      buffer[2] === 0x46 &&
      buffer[3] === 0x46
    ) {
      return 'wav';
    }
    if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) {
      return 'mp3';
    }
    if (
      buffer[0] === 0x4f &&
      buffer[1] === 0x67 &&
      buffer[2] === 0x67 &&
      buffer[3] === 0x53
    ) {
      return 'ogg';
    }
    if (
      buffer[0] === 0x66 &&
      buffer[1] === 0x4c &&
      buffer[2] === 0x61 &&
      buffer[3] === 0x43
    ) {
      return 'flac';
    }
  }
  return 'wav';
}

/**
 * Save audio recording to S3
 */
export async function saveAudioToS3(
  audioBuffer: Buffer,
  sessionId: string
): Promise<string> {
  const timestamp = Date.now();
  const key = `sessions/${sessionId}/audio-${timestamp}.wav`;

  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket:
          process.env.S3_BUCKET ||
          process.env.AWS_S3_BUCKET ||
          awsConfig.s3.bucket ||
          'noa-medical',
        Key: key,
        Body: audioBuffer,
        ContentType: 'audio/wav',
        Metadata: {
          sessionId,
          timestamp: timestamp.toString(),
        },
      })
    );

    return key;
  } catch (error) {
    console.error('Error saving audio to S3:', error);
    throw error;
  }
}

/**
 * Transcribe consultation audio using Amazon Bedrock Nova Sonic / Multimodal audio model.
 * Archives the raw audio recording to S3 and returns the verbatim clinical transcription.
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  sessionId?: string
): Promise<string> {
  const sid = sessionId || `session-${Date.now()}`;
  console.log('[Bedrock] Transcribing consultation audio for session:', sid);

  // 1. Archive audio recording to S3
  try {
    await saveAudioToS3(audioBuffer, sid);
  } catch (error) {
    console.warn(
      '[Bedrock] Warning: Could not archive audio recording to S3:',
      error
    );
  }

  const format = detectAudioFormat(audioBuffer);
  const systemInstruction =
    'You are an expert clinical transcription engine. Transcribe the spoken medical consultation in this audio recording accurately word-for-word. Return only the transcription text, with no preamble, filler, or markdown commentary.';

  // 2. First attempt: Bedrock Converse API with native audio content block
  try {
    const command = new ConverseCommand({
      modelId: SONIC_MODEL,
      messages: [
        {
          role: 'user',
          content: [
            {
              audio: {
                format,
                source: {
                  bytes: new Uint8Array(audioBuffer),
                },
              },
            } as any,
            {
              text: systemInstruction,
            },
          ],
        },
      ],
      inferenceConfig: {
        maxTokens: 2048,
        temperature: 0.1,
      },
    });

    const response = await bedrockClient.send(command);
    const transcript = response.output?.message?.content?.[0]?.text?.trim();
    if (transcript) {
      return transcript;
    }
  } catch (converseErr) {
    console.warn(
      '[Bedrock] Converse API audio transcription attempt, trying InvokeModel fallback:',
      converseErr
    );
  }

  // 3. Fallback: Bedrock InvokeModel API with Base64 audio payload
  try {
    const payload = {
      messages: [
        {
          role: 'user',
          content: [
            {
              audio: {
                format,
                source: {
                  bytes: audioBuffer.toString('base64'),
                },
              },
            },
            {
              text: systemInstruction,
            },
          ],
        },
      ],
      inferenceConfig: {
        maxTokens: 2048,
        temperature: 0.1,
      },
    };

    const invokeCmd = new InvokeModelCommand({
      modelId: SONIC_MODEL,
      contentType: 'application/json',
      body: JSON.stringify(payload),
    });

    const response = await bedrockClient.send(invokeCmd);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const transcript =
      responseBody.output?.message?.content?.[0]?.text ||
      responseBody.content?.[0]?.text ||
      responseBody.text ||
      '';

    if (transcript.trim()) {
      return transcript.trim();
    }
  } catch (invokeErr) {
    console.error(
      '[Bedrock] InvokeModel audio transcription error:',
      invokeErr
    );
    throw new Error(
      `Audio transcription failed via Bedrock [${SONIC_MODEL}]: ${
        invokeErr instanceof Error ? invokeErr.message : String(invokeErr)
      }`
    );
  }

  throw new Error(
    `Empty transcript returned by Bedrock audio model [${SONIC_MODEL}]`
  );
}
