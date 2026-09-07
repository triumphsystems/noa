import { SAMPLE_RATE } from './pcm-capture';

export class AudioQueuePlayer {
  private playbackContext: AudioContext | null = null;
  private nextPlayTime = 0;
  private audioQueue: ArrayBuffer[] = [];
  private remainder: Uint8Array | null = null;
  private onSpeakingChange?: (isSpeaking: boolean) => void;

  constructor(options?: { onSpeakingChange?: (isSpeaking: boolean) => void }) {
    this.onSpeakingChange = options?.onSpeakingChange;
  }

  public getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.playbackContext || this.playbackContext.state === 'closed') {
        const AudioCtx =
          window.AudioContext || (window as any).webkitAudioContext;
        this.playbackContext = new AudioCtx({ sampleRate: SAMPLE_RATE });
        this.nextPlayTime = 0;
      }
      if (this.playbackContext.state === 'suspended') {
        void this.playbackContext.resume();
      }
      return this.playbackContext;
    } catch (e) {
      console.warn('[AudioQueuePlayer] Failed to init playback context:', e);
      return null;
    }
  }

  public pushChunk(chunk: ArrayBuffer): void {
    this.audioQueue.push(chunk);
    this.playNext();
  }

  public playNext(): void {
    if (this.audioQueue.length === 0) return;
    const ctx = this.getContext();
    if (!ctx) return;

    this.onSpeakingChange?.(true);

    while (this.audioQueue.length > 0) {
      const rawChunk = this.audioQueue.shift()!;
      try {
        let chunkBytes = new Uint8Array(rawChunk);

        // Prepend leftover byte from previous chunk if any
        if (this.remainder && this.remainder.length > 0) {
          const combined = new Uint8Array(
            this.remainder.length + chunkBytes.length
          );
          combined.set(this.remainder, 0);
          combined.set(chunkBytes, this.remainder.length);
          chunkBytes = combined;
          this.remainder = null;
        }

        // Keep 16-bit word alignment; save trailing odd byte
        if (chunkBytes.length % 2 !== 0) {
          this.remainder = chunkBytes.slice(chunkBytes.length - 1);
          chunkBytes = chunkBytes.slice(0, chunkBytes.length - 1);
        }

        if (chunkBytes.length === 0) continue;

        const pcm16 = new Int16Array(
          chunkBytes.buffer,
          chunkBytes.byteOffset,
          chunkBytes.byteLength / 2
        );
        const float32 = new Float32Array(pcm16.length);
        for (let i = 0; i < pcm16.length; i++) {
          float32[i] = pcm16[i] / 32768;
        }

        // 16-sample edge fade to eliminate micro-clicks at chunk boundaries
        const fadeLen = Math.min(16, Math.floor(float32.length / 4));
        for (let i = 0; i < fadeLen; i++) {
          const factor = i / fadeLen;
          float32[i] *= factor;
          float32[float32.length - 1 - i] *= factor;
        }

        const audioBuffer = ctx.createBuffer(1, float32.length, SAMPLE_RATE);
        audioBuffer.copyToChannel(float32, 0);

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);

        const now = ctx.currentTime;
        let startTime: number;
        if (this.nextPlayTime <= now) {
          startTime = now + 0.08; // 80ms lookahead jitter buffer
        } else {
          startTime = this.nextPlayTime;
        }

        source.start(startTime);
        this.nextPlayTime = startTime + audioBuffer.duration;

        source.onended = () => {
          if (ctx.currentTime >= this.nextPlayTime - 0.05) {
            this.onSpeakingChange?.(false);
          }
        };
      } catch (err) {
        console.warn('[AudioQueuePlayer] Chunk decode error:', err);
      }
    }
  }

  public clear(): void {
    this.audioQueue = [];
    this.remainder = null;
    this.nextPlayTime = 0;
    this.onSpeakingChange?.(false);
  }

  public close(): void {
    this.clear();
    if (this.playbackContext && this.playbackContext.state !== 'closed') {
      this.playbackContext.close().catch(() => {});
      this.playbackContext = null;
    }
  }
}
