'use client'

import { Volume2, VolumeX, Sparkles, Bot } from 'lucide-react'

type AssistantPromptBoxProps = {
  assistantMessage: string
  isSpeaking: boolean
  isVoiceOutputEnabled: boolean
  onToggleVoiceOutput: () => void
}

export function AssistantPromptBox({
  assistantMessage,
  isSpeaking,
  isVoiceOutputEnabled,
  onToggleVoiceOutput,
}: AssistantPromptBoxProps) {
  return (
    <div className="rounded-2xl sm:rounded-3xl bg-soft-meadow/60 border border-deep-ink/8 p-4 sm:p-5 transition-all">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-deep-ink flex items-center justify-center text-hi-yellow shadow-2xs">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <p className="text-[11px] uppercase tracking-[0.25em] font-semibold text-slate">Noa says</p>
          {isSpeaking && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-moss-green bg-moss-green/15 px-2 py-0.5 rounded-full border border-moss-green/20">
              <span className="w-1.5 h-1.5 rounded-full bg-moss-green animate-ping" />
              Speaking live
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onToggleVoiceOutput}
          className="inline-flex items-center gap-1.5 text-xs text-slate hover:text-deep-ink px-2.5 py-1 rounded-full border border-deep-ink/10 bg-white shadow-2xs transition-colors"
          title={isVoiceOutputEnabled ? 'Mute voice audio' : 'Enable voice audio'}
        >
          {isVoiceOutputEnabled ? (
            <>
              <Volume2 className="w-3.5 h-3.5 text-moss-green" />
              <span className="text-[11px] font-medium">Voice on</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5 text-slate" />
              <span className="text-[11px] font-medium">Voice muted</span>
            </>
          )}
        </button>
      </div>

      <p className="text-base sm:text-xl font-medium leading-relaxed sm:leading-8 text-deep-ink font-serif">
        "{assistantMessage}"
      </p>
    </div>
  )
}
