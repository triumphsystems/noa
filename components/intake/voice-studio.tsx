'use client'

import { useState } from 'react'
import { Mic, MicOff, Keyboard, RotateCcw, Send, Sparkles } from 'lucide-react'

type VoiceStudioProps = {
  isRecording: boolean
  isListening: boolean
  isSubmitting: boolean
  transcriptPreview: string
  defaultPrompt: string
  onToggleMic: () => void
  onSubmitText: (text: string) => void
  onReset: () => void
}

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
  const [showTextInput, setShowTextInput] = useState(false)
  const [customText, setCustomText] = useState('')

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customText.trim() || isSubmitting) return
    onSubmitText(customText.trim())
    setCustomText('')
    setShowTextInput(false)
  }

  return (
    <div
      className={`relative flex-1 flex flex-col justify-between rounded-2xl border p-4 transition-all overflow-hidden ${
        isRecording
          ? 'border-hi-yellow/80 bg-white ring-2 ring-hi-yellow/20 shadow-md'
          : 'border-deep-ink/10 bg-canvas/70 shadow-2xs'
      }`}
    >
      {/* Waveform & Header indicator */}
      <div className="flex items-center justify-between pb-2 border-b border-deep-ink/5">
        <span className="text-[10px] uppercase font-bold tracking-wider text-slate">
          Live Speech Stream
        </span>

        {isRecording ? (
          <div className="flex items-center gap-1">
            <span className="w-1 h-3 bg-deep-ink rounded-full animate-pulse [animation-delay:0ms]" />
            <span className="w-1 h-5 bg-hi-yellow rounded-full animate-pulse [animation-delay:150ms]" />
            <span className="w-1 h-6 bg-deep-ink rounded-full animate-pulse [animation-delay:300ms]" />
            <span className="w-1 h-4 bg-hi-yellow rounded-full animate-pulse [animation-delay:75ms]" />
            <span className="w-1 h-2 bg-deep-ink rounded-full animate-pulse [animation-delay:200ms]" />
          </div>
        ) : (
          <span className="text-[10px] text-slate/60">Voice-ready</span>
        )}
      </div>

      {/* Transcript Text Display */}
      <div className="flex-1 flex flex-col justify-center py-4">
        {transcriptPreview ? (
          <p className="text-base sm:text-lg font-medium leading-relaxed text-deep-ink">
            "{transcriptPreview}"
            {isRecording && <span className="inline-block w-1.5 h-4 bg-hi-yellow ml-1 animate-pulse" />}
          </p>
        ) : (
          <p className="text-xs sm:text-sm text-slate/70 italic flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-slate/40" />
            <span>{defaultPrompt}</span>
          </p>
        )}
      </div>

      {/* Inline Type Drawer */}
      {showTextInput && (
        <form onSubmit={handleTextSubmit} className="mb-2 flex gap-1.5 bg-white p-1 rounded-xl border border-deep-ink/15 shadow-sm">
          <input
            type="text"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Type your response..."
            autoFocus
            className="flex-1 px-3 py-1.5 text-xs text-deep-ink placeholder:text-slate/60 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!customText.trim() || isSubmitting}
            className="px-2.5 py-1 bg-deep-ink text-white rounded-lg text-xs font-semibold hover:bg-deep-ink/90 disabled:opacity-50"
          >
            <Send className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => setShowTextInput(false)}
            className="px-2 py-1 text-slate hover:text-deep-ink text-xs"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Floating Bottom Action Dock */}
      <div className="pt-2 border-t border-deep-ink/5 flex items-center justify-between">
        <span className="text-[10px] text-slate/70">
          {isRecording ? (isListening ? '● Listening live...' : '● Connecting...') : '● Auto-submits on silence'}
        </span>

        <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-xs p-1 rounded-full border border-deep-ink/10 shadow-2xs">
          <button
            type="button"
            onClick={() => setShowTextInput(!showTextInput)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate hover:text-deep-ink hover:bg-soft-meadow transition-colors"
            title="Type fallback"
          >
            <Keyboard className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onReset}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate hover:text-deep-ink hover:bg-soft-meadow transition-colors"
            title="Reset conversation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onToggleMic}
            disabled={isSubmitting}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-xs ${
              isRecording
                ? 'bg-deep-ink text-white ring-4 ring-hi-yellow/40 hover:bg-deep-ink/90'
                : 'bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 hover:scale-105'
            }`}
            title={isRecording ? 'Stop microphone' : 'Start microphone'}
          >
            {isRecording ? (
              <MicOff className="w-4 h-4 text-red-400 animate-pulse" />
            ) : (
              <Mic className="w-4 h-4 text-deep-ink" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
