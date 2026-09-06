/**
 * AudioWorkletProcessor: PCM Capture
 * Converts Web Audio Float32 PCM [-1.0, 1.0] to 16-bit signed Linear PCM (16kHz).
 * Buffers 100ms chunks (1600 samples = 3200 bytes) before posting to avoid audio packet flooding.
 */
class PcmCapture extends AudioWorkletProcessor {
  constructor() {
    super();
    // 100ms at 16kHz = 1600 samples
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
