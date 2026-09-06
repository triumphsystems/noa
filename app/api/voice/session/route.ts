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

function buildUserTextContentStart(promptId: string, textContentId: string): Uint8Array {
  const payload = {
    event: {
      contentStart: {
        promptName: promptId,
        promptId: promptId,
        contentName: textContentId,
        contentId: textContentId,
        type: 'TEXT',
        interactive: true,
        role: 'USER',
        textInputConfiguration: {
          mediaType: 'text/plain',
        },
      },
    },
  };
  return new TextEncoder().encode(JSON.stringify(payload));
}

function buildUserTextInput(
  promptId: string,
  textContentId: string,
  text: string
): Uint8Array {
  const payload = {
    event: {
      textInput: {
        promptName: promptId,
        promptId: promptId,
        contentName: textContentId,
        contentId: textContentId,
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
    const ev = obj?.event || obj;
    if (!ev) return;
    const audioData = ev.audioOutput?.content || ev.audio?.content || ev.audioOutput;
    if (typeof audioData === 'string') {
      try {
        results.push({ audio: Buffer.from(audioData, 'base64') });
      } catch {
        // Ignore invalid base64
      }
    } else if (audioData instanceof Uint8Array || Buffer.isBuffer(audioData)) {
      results.push({ audio: Buffer.from(audioData) });
    }

    const textData = ev.textOutput?.content || ev.text?.content || ev.textOutput;
    if (textData) {
      results.push({
        text: typeof textData === 'string' ? textData : String(textData),
        role: ev.textOutput?.role || ev.role || 'ASSISTANT',
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
        // Skip
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
      `[Voice/WS] Session ${sessionId} connected — model: ${modelId} (${region})`
    );

    // Correlated turn IDs required by Amazon Bedrock Nova Sonic protocol
    const promptId = randomUUID();
    const systemContentId = randomUUID();
    let activeAudioContentId: string | null = null;

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

      // 4. Process dynamic events (audio input, text input, end of utterance)
      while (!streamDone) {
        if (chunkQueue.length > 0) {
          const bytes = chunkQueue.shift()!;
          yield { chunk: { bytes } };
        } else {
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

      // 5. If an audio content block was open, close it
      if (activeAudioContentId) {
        yield { chunk: { bytes: buildContentEnd(promptId, activeAudioContentId) } };
      }

      // 6. Close prompt turn and session
      yield { chunk: { bytes: buildPromptEnd(promptId) } };
      yield { chunk: { bytes: buildSessionEnd() } };
    }

    // Launch the Bedrock bidirectional stream
    const input: InvokeModelWithBidirectionalStreamCommandInput = {
      modelId,
      body: bodyGenerator(),
    };

    const command = new InvokeModelWithBidirectionalStreamCommand(input);

    bedrockStreamClient
      .send(command)
      .then(async (response) => {
        if (!response.body) {
          console.error('[Voice/WS] Bedrock returned no response body');
          ws.send(JSON.stringify({ type: 'error', message: 'No response from voice model' }));
          return;
        }
        console.log(`[Voice/WS] Bedrock stream established for session ${sessionId}`);

        try {
          for await (const event of response.body) {
            if (event.chunk?.bytes) {
              const events = parseBedrockChunk(event.chunk.bytes);
              if (events.length > 0) {
                for (const ev of events) {
                  if (ev.audio) {
                    // Send raw LPCM audio bytes to browser
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
                    if (ev.role === 'ASSISTANT') {
                      ws.send(
                        JSON.stringify({
                          type: 'assistant_message',
                          payload: { text: ev.text },
                        })
                      );
                    }
                  }
                }
              } else {
                // If chunk is already raw binary audio, forward directly
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

    // Notify browser that WebSocket connection is established
    ws.send(JSON.stringify({ type: 'ready', sessionId }));

    // Handle incoming messages from browser
    ws.on('message', async (data: WebSocketData) => {
      try {
        if (typeof data === 'string') {
          const msg = JSON.parse(data) as {
            type: string;
            text?: string;
            payload?: any;
          };

          // User started a new microphone speaking turn
          if (msg.type === 'audio_start') {
            if (!activeAudioContentId) {
              activeAudioContentId = randomUUID();
              chunkQueue.push(
                buildAudioContentStart(promptId, activeAudioContentId)
              );
            }
            return;
          }

          // User completed their speaking turn -> close audio block to trigger Bedrock response
          if (msg.type === 'audio_end') {
            if (activeAudioContentId) {
              chunkQueue.push(
                buildContentEnd(promptId, activeAudioContentId)
              );
              activeAudioContentId = null;
            }
            return;
          }

          // Vocalize text input or assistant response via Bedrock
          if (msg.type === 'speak' || msg.type === 'text_input') {
            const textToSpeak = msg.text || msg.payload?.text;
            if (textToSpeak && textToSpeak.trim()) {
              const textContentId = randomUUID();
              chunkQueue.push(
                buildUserTextContentStart(promptId, textContentId)
              );
              chunkQueue.push(
                buildUserTextInput(promptId, textContentId, textToSpeak.trim())
              );
              chunkQueue.push(
                buildContentEnd(promptId, textContentId)
              );
            }
            return;
          }

          if (msg.type === 'end') {
            streamDone = true;
            ws.send(
              JSON.stringify({
                type: 'session_complete',
                sessionId,
                transcript: fullTranscript.trim(),
              })
            );
            return;
          }

          if (msg.type === 'transcript_chunk' && msg.payload?.text) {
            fullTranscript += ` ${msg.payload.text}`;
          }
          return;
        }

        // Binary PCM audio chunks from browser's AudioWorklet
        if (
          data instanceof Buffer ||
          data instanceof ArrayBuffer ||
          ArrayBuffer.isView(data)
        ) {
          // If user started streaming without explicit audio_start, open content block
          if (!activeAudioContentId) {
            activeAudioContentId = randomUUID();
            chunkQueue.push(
              buildAudioContentStart(promptId, activeAudioContentId)
            );
          }

          const bytes =
            data instanceof Buffer ? data : Buffer.from(data as ArrayBuffer);
          const base64 = bytes.toString('base64');
          chunkQueue.push(
            buildAudioChunk(promptId, activeAudioContentId, base64)
          );
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
