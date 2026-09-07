export const SAMPLE_RATE = 16000; // Hz required by Amazon Bedrock Nova Sonic
export const SLICE_DURATION_MS = 100;
export const WS_RECONNECT_DELAY_BASE_MS = 1000;
export const WS_RECONNECT_DELAY_MAX_MS = 15000;

export const AUDIO_WORKLET_CODE = /* javascript */ `
class PcmCapture extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 1600;
    this.buffer = new Int16Array(this.bufferSize);
    this.bufferIndex = 0;
  }
  process(inputs) {
    const input = inputs[0]?.[0];
    if (!input || input.length === 0) return true;
    for (let i = 0; i < input.length; i++) {
      const clamped = Math.max(-1, Math.min(1, input[i]));
      this.buffer[this.bufferIndex++] = clamped < 0 ? clamped * 32768 : clamped * 32767;
      if (this.bufferIndex >= this.bufferSize) {
        const chunk = this.buffer.slice(0, this.bufferSize);
        this.port.postMessage(chunk.buffer, [chunk.buffer]);
        this.bufferIndex = 0;
      }
    }
    return true;
  }
}
registerProcessor('pcm-capture', PcmCapture);
`;

/**
 * Ensures the pcm-capture AudioWorklet processor module is registered with the AudioContext
 */
export async function registerPcmWorklet(ctx: AudioContext): Promise<void> {
  try {
    await ctx.audioWorklet.addModule('/pcm-worklet.js');
  } catch {
    const blob = new Blob([AUDIO_WORKLET_CODE], {
      type: 'application/javascript',
    });
    const workletUrl = URL.createObjectURL(blob);
    try {
      await ctx.audioWorklet.addModule(workletUrl);
    } finally {
      URL.revokeObjectURL(workletUrl);
    }
  }
}
