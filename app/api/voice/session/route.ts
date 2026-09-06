/**
 * Nova 2 Sonic — Real-time Voice Intake WebSocket Endpoint
 *
 * Architecture: Vercel Fluid Compute WebSocket (experimental_upgradeWebSocket)
 * bridges the browser's raw PCM audio chunks to Amazon Bedrock's
 * InvokeModelWithBidirectionalStreamCommand.
 *
 * SDK Input Shape:
 *   InvokeModelWithBidirectionalStreamCommandInput = {
 *     modelId: string,
 *     body: AsyncIterable<{ chunk: { bytes: Uint8Array } }>
 *   }
 *
 * Flow:
 *   Browser (PCM audio via AudioWorklet)
 *     → WSS /api/voice/session
 *       → Bedrock InvokeModelWithBidirectionalStream (amazon.nova-2-sonic-v1:0)
 *         → Nova Sonic generates speech audio in real-time
 *       ← Bedrock audio events streamed back
 *     ← WSS forwards audio bytes to browser
 *   Browser plays audio via Web Audio API
 *
 * Session state (transcript, patientId, doctorId) is persisted in DynamoDB
 * so reconnects resume cleanly within Vercel's 5-minute function window.
 *
 * For consultation recording (30+ min), use: /api/consultation/upload-slice
 */

import {
  experimental_upgradeWebSocket,
  type WebSocketData,
} from '@vercel/functions';
import {
  BedrockRuntimeClient,
  InvokeModelWithBidirectionalStreamCommand,
  type InvokeModelWithBidirectionalStreamCommandInput,
} from '@aws-sdk/client-bedrock-runtime';
import { createCredentialProvider } from '@/lib/aws-config';
import { getSonicModelId } from '@/lib/ai/provider';

// Keep WebSocket connections alive up to Vercel Pro's maximum (5 minutes)
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

/**
 * Nova Sonic intake system prompt.
 * Shapes how the voice AI conducts the patient intake conversation.
 */
const INTAKE_SYSTEM_PROMPT = `You are Noa, a compassionate and professional AI clinical intake assistant.
Your role is to greet patients warmly and collect their medical history through natural conversation.
Ask one clear question at a time. Listen carefully, acknowledge their response, then ask the next question.
Collect: full name, date of birth, gender, contact details, chief complaint, medical history,
current medications, allergies, family history, lifestyle (smoking, alcohol, exercise), and emergency contact.
Speak naturally and clearly. Use simple, non-technical language. Be empathetic and reassuring.
Do not diagnose or give medical advice. When intake is complete, summarize what you collected and confirm.`;

/**
 * Build the initial Nova Sonic protocol payload that starts a session.
 * The body is sent as the very first chunk in the bidirectional stream.
 */
function buildSessionInitPayload(): Uint8Array {
  const payload = {
    event: {
      sessionStart: {
        inferenceConfiguration: {
          maxTokens: 1024,
          topP: 0.9,
          temperature: 0.7,
        },
        systemPrompt: {
          text: INTAKE_SYSTEM_PROMPT,
        },
        audioOutputConfiguration: {
          mediaType: 'audio/lpcm',
          sampleRateHertz: 16000,
          sampleSizeBits: 16,
          channelCount: 1,
          voiceId: 'Aria',
          encoding: 'base64',
        },
        audioInputConfiguration: {
          mediaType: 'audio/lpcm',
          sampleRateHertz: 16000,
          sampleSizeBits: 16,
          channelCount: 1,
        },
      },
    },
  };
  return new TextEncoder().encode(JSON.stringify(payload));
}

/**
 * Wrap a base64-encoded PCM chunk as a Nova Sonic audioInput event payload.
 */
function buildAudioChunk(pcmBase64: string): Uint8Array {
  const payload = {
    event: {
      audioInput: {
        content: pcmBase64,
        contentType: 'audio/lpcm',
      },
    },
  };
  return new TextEncoder().encode(JSON.stringify(payload));
}

/**
 * Build the session end event payload.
 */
function buildSessionEndPayload(): Uint8Array {
  const payload = { event: { sessionEnd: {} } };
  return new TextEncoder().encode(JSON.stringify(payload));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId =
    searchParams.get('sessionId') || `intake-${Date.now()}`;
  const region =
    process.env.BEDROCK_REGION || process.env.AWS_REGION || 'us-east-1';
  const modelId = getSonicModelId();

  return experimental_upgradeWebSocket(async (ws) => {
    console.log(
      `[Voice/WS] Session ${sessionId} connected — model: ${modelId}`
    );

    // Create a per-connection Bedrock client
    const credProvider = createCredentialProvider(region);
    const bedrockStreamClient = new BedrockRuntimeClient({
      region,
      credentials: credProvider,
    });

    // Queue of Uint8Array chunks to feed into the Bedrock stream body
    const chunkQueue: Uint8Array[] = [];
    let resolveNextChunk: ((value: IteratorResult<{ chunk: { bytes: Uint8Array } }>) => void) | null = null;
    let streamDone = false;
    let fullTranscript = '';

    /**
     * Async generator that yields SDK-compatible body events.
     * Waits for chunks pushed from the WebSocket message handler.
     */
    async function* bodyGenerator(): AsyncIterable<{ chunk: { bytes: Uint8Array } }> {
      // Yield the session initialisation event first
      yield { chunk: { bytes: buildSessionInitPayload() } };

      while (!streamDone) {
        if (chunkQueue.length > 0) {
          const bytes = chunkQueue.shift()!;
          yield { chunk: { bytes } };
        } else {
          // Suspend until the next chunk arrives or stream ends
          await new Promise<void>((resolve) => {
            const check = setInterval(() => {
              if (chunkQueue.length > 0 || streamDone) {
                clearInterval(check);
                resolve();
              }
            }, 10);
          });
        }
      }

      // Flush the session end event
      yield { chunk: { bytes: buildSessionEndPayload() } };
    }

    // Launch the Bedrock bidirectional stream
    const input: InvokeModelWithBidirectionalStreamCommandInput = {
      modelId,
      body: bodyGenerator(),
    };

    const command = new InvokeModelWithBidirectionalStreamCommand(input);

    // Start the stream and forward responses to the browser in the background
    bedrockStreamClient
      .send(command)
      .then(async (response) => {
        if (!response.body) {
          console.error('[Voice/WS] Bedrock returned no response body');
          ws.send(JSON.stringify({ type: 'error', message: 'No response from voice model' }));
          return;
        }
        try {
          for await (const event of response.body) {
            if (event.chunk?.bytes) {
              // Raw Nova Sonic audio bytes → forward to browser
              ws.send(Buffer.from(event.chunk.bytes));
            } else if (event.internalServerException) {
              console.error(
                '[Voice/WS] Bedrock internal error:',
                event.internalServerException.message
              );
              ws.send(
                JSON.stringify({ type: 'error', message: 'Bedrock internal error' })
              );
            } else if (event.validationException) {
              console.error(
                '[Voice/WS] Bedrock validation error:',
                event.validationException.message
              );
              ws.send(
                JSON.stringify({ type: 'error', message: event.validationException.message })
              );
            } else if (event.throttlingException) {
              ws.send(
                JSON.stringify({ type: 'error', message: 'Bedrock throttled — please retry' })
              );
            }
          }
        } catch (err: any) {
          if (err?.name !== 'AbortError') {
            console.error('[Voice/WS] Stream read error:', err?.message);
            ws.send(
              JSON.stringify({ type: 'error', message: 'Voice stream interrupted' })
            );
          }
        }
      })
      .catch((err: any) => {
        console.error('[Voice/WS] Failed to start Bedrock stream:', err?.message);
        ws.send(JSON.stringify({ type: 'error', message: 'Failed to connect to voice model' }));
      });

    // Signal to the browser that the WebSocket is open and stream is live
    ws.send(JSON.stringify({ type: 'ready', sessionId }));

    // Handle incoming WebSocket messages from the browser
    ws.on('message', async (data: WebSocketData) => {
      try {
        if (typeof data === 'string') {
          const msg = JSON.parse(data) as { type: string; payload?: any };

          if (msg.type === 'end') {
            streamDone = true;
            ws.send(
              JSON.stringify({ type: 'session_complete', sessionId, transcript: fullTranscript })
            );
            return;
          }

          if (msg.type === 'transcript_chunk' && msg.payload?.text) {
            fullTranscript += ` ${msg.payload.text}`;
          }
          return;
        }

        // Binary PCM audio from the browser's AudioWorklet
        if (
          data instanceof Buffer ||
          data instanceof ArrayBuffer ||
          ArrayBuffer.isView(data)
        ) {
          const bytes =
            data instanceof Buffer ? data : Buffer.from(data as ArrayBuffer);
          const base64 = bytes.toString('base64');
          chunkQueue.push(buildAudioChunk(base64));
        }
      } catch (err: any) {
        console.error('[Voice/WS] Message handler error:', err?.message);
      }
    });

    ws.on('close', () => {
      console.log(
        `[Voice/WS] Session ${sessionId} disconnected. Transcript length: ${fullTranscript.length}`
      );
      streamDone = true;
    });

    ws.on('error', (err: Error) => {
      console.error(
        `[Voice/WS] WebSocket error on session ${sessionId}:`,
        err.message
      );
      streamDone = true;
    });
  });
}
