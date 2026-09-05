'use client';

import { useState } from 'react';
import { Mic, MicOff, Keyboard, RotateCcw, Send, Sparkles } from 'lucide-react';

type VoiceStudioProps = {
  isRecording: boolean;
  isListening: boolean;
  isSubmitting: boolean;
  transcriptPreview: string;
  defaultPrompt: string;
  onToggleMic: () => void;
  onSubmitText: (text: string) => void;
  onReset: () => void;
};

export function VoiceStudio({
  isRecording,
  isListening,
  isSubmitting,
  transcriptPreview,
  defaultPrompt,
  onToggleMic,
  onSubmitText,
  onReset,
}: VoiceStudioProps) {
  const [showTextInput, setShowTextInput] = useState(false);
  const [customText, setCustomText] = useState('');

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customText.trim() || isSubmitting) return;
    onSubmitText(customText.trim());
    setCustomText('');
    setShowTextInput(false);
  };

  return (
    <div
      className={`relative flex flex-1 flex-col justify-between overflow-hidden rounded-2xl border p-4 transition-all ${
        isRecording
          ? 'border-hi-yellow/80 ring-hi-yellow/20 bg-white shadow-md ring-2'
          : 'border-deep-ink/10 bg-canvas/70 shadow-2xs'
      }`}
    >
      {/* Waveform & Header indicator */}
      <div className="border-deep-ink/5 flex items-center justify-between border-b pb-2">
        <span className="text-slate text-[10px] font-bold tracking-wider uppercase">
          Live Speech Stream
        </span>

        {isRecording ? (
          <div className="flex items-center gap-1">
            <span className="bg-deep-ink h-3 w-1 animate-pulse rounded-full [animation-delay:0ms]" />
            <span className="bg-hi-yellow h-5 w-1 animate-pulse rounded-full [animation-delay:150ms]" />
            <span className="bg-deep-ink h-6 w-1 animate-pulse rounded-full [animation-delay:300ms]" />
            <span className="bg-hi-yellow h-4 w-1 animate-pulse rounded-full [animation-delay:75ms]" />
            <span className="bg-deep-ink h-2 w-1 animate-pulse rounded-full [animation-delay:200ms]" />
          </div>
        ) : (
          <span className="text-slate/60 text-[10px]">Voice-ready</span>
        )}
      </div>

      {/* Transcript Text Display */}
      <div className="flex flex-1 flex-col justify-center py-4">
        {transcriptPreview ? (
          <p className="text-deep-ink text-base leading-relaxed font-medium sm:text-lg">
            "{transcriptPreview}"
            {isRecording && (
              <span className="bg-hi-yellow ml-1 inline-block h-4 w-1.5 animate-pulse" />
            )}
          </p>
        ) : (
          <p className="text-slate/70 flex items-center gap-2 text-xs italic sm:text-sm">
            <Sparkles className="text-slate/40 h-3.5 w-3.5" />
            <span>{defaultPrompt}</span>
          </p>
        )}
      </div>

      {/* Inline Type Drawer */}
      {showTextInput && (
        <form
          onSubmit={handleTextSubmit}
          className="border-deep-ink/15 mb-2 flex gap-1.5 rounded-xl border bg-white p-1 shadow-sm"
        >
          <input
            type="text"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Type your response..."
            autoFocus
            className="text-deep-ink placeholder:text-slate/60 flex-1 px-3 py-1.5 text-xs focus:outline-none"
          />
          <button
            type="submit"
            disabled={!customText.trim() || isSubmitting}
            className="bg-deep-ink hover:bg-deep-ink/90 rounded-lg px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-50"
          >
            <Send className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => setShowTextInput(false)}
            className="text-slate hover:text-deep-ink px-2 py-1 text-xs"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Floating Bottom Action Dock */}
      <div className="border-deep-ink/5 flex items-center justify-between border-t pt-2">
        <span className="text-slate/70 text-[10px]">
          {isRecording
            ? isListening
              ? '● Listening live...'
              : '● Connecting...'
            : '● Auto-submits on silence'}
        </span>

        <div className="border-deep-ink/10 flex items-center gap-1.5 rounded-full border bg-white/90 p-1 shadow-2xs backdrop-blur-xs">
          <button
            type="button"
            onClick={() => setShowTextInput(!showTextInput)}
            className="text-slate hover:text-deep-ink hover:bg-soft-meadow flex h-8 w-8 items-center justify-center rounded-full transition-colors"
            title="Type fallback"
          >
            <Keyboard className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={onReset}
            className="text-slate hover:text-deep-ink hover:bg-soft-meadow flex h-8 w-8 items-center justify-center rounded-full transition-colors"
            title="Reset conversation"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={onToggleMic}
            disabled={isSubmitting}
            className={`flex h-10 w-10 items-center justify-center rounded-full shadow-xs transition-all ${
              isRecording
                ? 'bg-deep-ink ring-hi-yellow/40 hover:bg-deep-ink/90 text-white ring-4'
                : 'bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 hover:scale-105'
            }`}
            title={isRecording ? 'Stop microphone' : 'Start microphone'}
          >
            {isRecording ? (
              <MicOff className="h-4 w-4 animate-pulse text-red-400" />
            ) : (
              <Mic className="text-deep-ink h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
