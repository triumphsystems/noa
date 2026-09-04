'use client'

import { Mic } from 'lucide-react'

type AudioWaveformProps = {
  isRecording: boolean
  isListening: boolean
  transcriptPreview: string
  defaultPrompt: string
}

export function AudioWaveform({
  isRecording,
  isListening,
  transcriptPreview,
  defaultPrompt,
}: AudioWaveformProps) {
  return (
    <div
      className={`rounded-2xl sm:rounded-3xl border transition-all p-4 sm:p-5 ${
        isRecording
          ? 'border-hi-yellow/80 bg-white shadow-md ring-2 ring-hi-yellow/20'
          : 'border-deep-ink/10 bg-canvas'
      }`}
    >
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <p className="text-[11px] uppercase tracking-[0.25em] text-slate font-medium">
          Live Speech Transcript
        </p>

        {isRecording && (
          <div className="flex items-center gap-1">
            <span className="w-1 h-3 bg-deep-ink rounded-full animate-pulse [animation-delay:0ms]" />
            <span className="w-1 h-5 bg-hi-yellow rounded-full animate-pulse [animation-delay:150ms]" />
            <span className="w-1 h-6 bg-deep-ink rounded-full animate-pulse [animation-delay:300ms]" />
            <span className="w-1 h-4 bg-hi-yellow rounded-full animate-pulse [animation-delay:75ms]" />
            <span className="w-1 h-2 bg-deep-ink rounded-full animate-pulse [animation-delay:200ms]" />
          </div>
        )}
      </div>

      <div className="min-h-20 sm:min-h-24 flex flex-col justify-center">
        {transcriptPreview ? (
          <p className="text-sm sm:text-base leading-6 sm:leading-7 text-deep-ink font-medium">
            "{transcriptPreview}"
            {isRecording && <span className="inline-block w-1.5 h-4 bg-hi-yellow ml-1 animate-pulse" />}
          </p>
        ) : (
          <div className="text-center sm:text-left py-2">
            <p className="text-xs sm:text-sm text-slate/70 italic flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5 text-slate/40" />
              <span>{defaultPrompt}</span>
            </p>
          </div>
        )}
      </div>

      <div className="mt-2 pt-2 border-t border-deep-ink/5 flex items-center justify-between text-[11px] text-slate">
        <span>{isRecording ? (isListening ? '• Streaming audio' : '• Initializing mic...') : '• Microphone idle'}</span>
        <span className="text-[10px] text-slate/60">Auto-sends on pause</span>
      </div>
    </div>
  )
}
