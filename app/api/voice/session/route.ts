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
 *       → Bedrock InvokeModelWithBidirectionalStream (amazon.nova-2-sonic-v1:0 / amazon.nova-sonic-v1:0)
 *         → Nova Sonic generates speech audio in real-time
 *       ← Bedrock audio events streamed back (parsed from event.chunk.bytes JSON)
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
import { randomUUID } from 'crypto';
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
 * Nova Sonic Event Builders
 *
 * Amazon Bedrock InvokeModelWithBidirectionalStream protocol requires a strict hierarchical
 * event sequence:
 * 1. sessionStart (inference configuration)
 * 2. promptStart (prompt context, audio & text output configuration)
 * 3. contentStart (system prompt metadata)
 * 4. textInput (system prompt content)
 * 5. contentEnd (close system prompt content block)
 * 6. contentStart (user audio stream metadata)
 * 7. audioInput (raw base64 LPCM audio chunks)
 * 8. contentEnd (close audio block) -> promptEnd -> sessionEnd
 *
 * All prompt and content events require promptName/promptId and contentName/contentId.
 */

function buildSessionStart(): Uint8Array {
  const payload = {
    event: {
      sessionStart: {
        inferenceConfiguration: {
          maxTokens: 1024,
          topP: 0.9,
          temperature: 0.7,
        },
      },
    },
  };
  return new TextEncoder().encode(JSON.stringify(payload));
}

function buildPromptStart(promptId: string): Uint8Array {
  const voiceId = process.env.BEDROCK_SONIC_VOICE_ID || 'matthew';
  const payload = {
    event: {
      promptStart: {
        promptName: promptId,
        promptId: promptId,
        textOutputConfiguration: {
          mediaType: 'text/plain',
        },
        audioOutputConfiguration: {
          mediaType: 'audio/lpcm',
          sampleRateHertz: 16000,
          sampleSizeBits: 16,
          channelCount: 1,
          voiceId,
          encoding: 'base64',
          audioType: 'SPEECH',
        },
      },
    },
  };
  return new TextEncoder().encode(JSON.stringify(payload));
}

function buildSystemContentStart(promptId: string, systemContentId: string): Uint8Array {
  const payload = {
    event: {
      contentStart: {
        promptName: promptId,
        promptId: promptId,
        contentName: systemContentId,
        contentId: systemContentId,
        type: 'TEXT',
        interactive: true,
        role: 'SYSTEM',
        textInputConfiguration: {
          mediaType: 'text/plain',
        },
      },
    },
  };
  return new TextEncoder().encode(JSON.stringify(payload));
}

function buildSystemTextInput(
  promptId: string,
  systemContentId: string,
  text: string
): Uint8Array {
  const payload = {
    event: {
      textInput: {
        promptName: promptId,
        promptId: promptId,
        contentName: systemContentId,
        contentId: systemContentId,
        content: text,
      },
    },
  };
  return new TextEncoder().encode(JSON.stringify(payload));
}

function buildContentEnd(promptId: string, contentId: string): Uint8Array {
  const payload = {
    event: {
      contentEnd: {
        promptName: promptId,
        promptId: promptId,
        contentName: contentId,
        contentId: contentId,
      },
    },
  };
  return new TextEncoder().encode(JSON.stringify(payload));
}

function buildAudioContentStart(promptId: string, audioContentId: string): Uint8Array {
  const payload = {
    event: {
      contentStart: {
        promptName: promptId,
        promptId: promptId,
        contentName: audioContentId,
        contentId: audioContentId,
        type: 'AUDIO',
        interactive: true,
        role: 'USER',
        audioInputConfiguration: {
          mediaType: 'audio/lpcm',
          sampleRateHertz: 16000,
          sampleSizeBits: 16,
          channelCount: 1,
          audioType: 'SPEECH',
          encoding: 'base64',
        },
      },
    },
  };
  return new TextEncoder().encode(JSON.stringify(payload));
}

function buildAudioChunk(
  promptId: string,
  audioContentId: string,
  pcmBase64: string
): Uint8Array {
  const payload = {
    event: {
      audioInput: {
        promptName: promptId,
        promptId: promptId,
        contentName: audioContentId,
        contentId: audioContentId,
        content: pcmBase64,
      },
    },
  };
  return new TextEncoder().encode(JSON.stringify(payload));
}

function buildPromptEnd(promptId: string): Uint8Array {
  const payload = {
    event: {
      promptEnd: {
        promptName: promptId,
        promptId: promptId,
      },
    },
  };
  return new TextEncoder().encode(JSON.stringify(payload));
}

function buildSessionEnd(): Uint8Array {
  const payload = {
    event: {
      sessionEnd: {},
    },
  };
  return new TextEncoder().encode(JSON.stringify(payload));
}

interface ParsedBedrockEvent {
  audio?: Buffer;
  text?: string;
  role?: string;
}

function parseBedrockChunk(bytes: Uint8Array): ParsedBedrockEvent[] {
  const str = Buffer.from(bytes).toString('utf-8').trim();
  const results: ParsedBedrockEvent[] = [];

  const extract = (obj: any) => {
    const ev = obj?.event;
    if (!ev) return;
    if (ev.audioOutput?.content) {
      results.push({ audio: Buffer.from(ev.audioOutput.content, 'base64') });
    }
    if (ev.textOutput?.content) {
      results.push({
        text: ev.textOutput.content,
        role: ev.textOutput.role || 'ASSISTANT',
      });
    }
  };

  try {
    const parsed = JSON.parse(str);
    extract(parsed);
    return results;
  } catch {
    const lines = str.split('\n').map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      try {
        const parsed = JSON.parse(line);
        extract(parsed);
      } catch {
        // Skip unparseable lines
      }
    }
  }

  return results;
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

    // Correlated turn IDs required by Amazon Bedrock Nova Sonic protocol
    const promptId = randomUUID();
    const systemContentId = randomUUID();
    const audioContentId = randomUUID();

    // Create a per-connection Bedrock client
    const credProvider = createCredentialProvider(region);
    const bedrockStreamClient = new BedrockRuntimeClient({
      region,
      credentials: credProvider,
    });

    // Queue of Uint8Array chunks to feed into the Bedrock stream body
    const chunkQueue: Uint8Array[] = [];
    let streamDone = false;
    let fullTranscript = '';

    /**
     * Async generator that yields SDK-compatible body events in correct sequence.
     */
    async function* bodyGenerator(): AsyncIterable<{ chunk: { bytes: Uint8Array } }> {
      // 1. Session start
      yield { chunk: { bytes: buildSessionStart() } };

      // 2. Prompt start with audio & text output configuration
      yield { chunk: { bytes: buildPromptStart(promptId) } };

      // 3. System prompt block
      yield { chunk: { bytes: buildSystemContentStart(promptId, systemContentId) } };
      yield { chunk: { bytes: buildSystemTextInput(promptId, systemContentId, INTAKE_SYSTEM_PROMPT) } };
      yield { chunk: { bytes: buildContentEnd(promptId, systemContentId) } };

      // 4. Start audio input block for streaming user speech
      yield { chunk: { bytes: buildAudioContentStart(promptId, audioContentId) } };

      // 5. Stream audio chunks pushed from the WebSocket message handler
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

      // 6. Close audio block, prompt, and session
      yield { chunk: { bytes: buildContentEnd(promptId, audioContentId) } };
      yield { chunk: { bytes: buildPromptEnd(promptId) } };
      yield { chunk: { bytes: buildSessionEnd() } };
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
              const events = parseBedrockChunk(event.chunk.bytes);
              if (events.length > 0) {
                for (const ev of events) {
                  if (ev.audio) {
                    // Raw Nova Sonic LPCM audio bytes → forward to browser
                    ws.send(ev.audio);
                  }
                  if (ev.text && ev.text.trim()) {
                    if (ev.role === 'ASSISTANT') {
                      fullTranscript += ` ${ev.text}`;
                    }
                    ws.send(
                      JSON.stringify({
                        type: 'transcript_chunk',
                        payload: { text: ev.text, role: ev.role },
                      })
                    );
                  }
                }
              } else {
                // If chunk is raw binary audio, forward directly
                ws.send(Buffer.from(event.chunk.bytes));
              }
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
              JSON.stringify({ type: 'session_complete', sessionId, transcript: fullTranscript.trim() })
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
          chunkQueue.push(buildAudioChunk(promptId, audioContentId, base64));
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
