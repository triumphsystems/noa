/**
 * AudioWorkletProcessor: PCM Capture
 * Converts Web Audio Float32 PCM [-1.0, 1.0] to 16-bit signed Linear PCM (16kHz).
 * Runs on the audio rendering thread and posts transferable ArrayBuffers to the main thread.
 */
class PcmCapture extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0]?.[0];
    if (!input || input.length === 0) return true;

    // Convert Float32 [-1, 1] to Int16 [-32768, 32767]
    const pcm = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
      const clamped = Math.max(-1, Math.min(1, input[i]));
      pcm[i] = clamped < 0 ? clamped * 32768 : clamped * 32767;
    }

    this.port.postMessage(pcm.buffer, [pcm.buffer]);
    return true;
  }
}

registerProcessor('pcm-capture', PcmCapture);
