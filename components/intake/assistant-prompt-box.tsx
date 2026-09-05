'use client';

import { Volume2, VolumeX, Sparkles, Bot } from 'lucide-react';

type AssistantPromptBoxProps = {
  assistantMessage: string;
  isSpeaking: boolean;
  isVoiceOutputEnabled: boolean;
  onToggleVoiceOutput: () => void;
};

export function AssistantPromptBox({
  assistantMessage,
  isSpeaking,
  isVoiceOutputEnabled,
  onToggleVoiceOutput,
}: AssistantPromptBoxProps) {
  return (
    <div className="bg-soft-meadow/60 border-deep-ink/8 rounded-2xl border p-4 transition-all sm:rounded-3xl sm:p-5">
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-deep-ink text-hi-yellow flex h-6 w-6 items-center justify-center rounded-lg shadow-2xs">
            <Bot className="h-3.5 w-3.5" />
          </div>
          <p className="text-slate text-[11px] font-semibold tracking-[0.25em] uppercase">
            Noa says
          </p>
          {isSpeaking && (
            <span className="text-moss-green bg-moss-green/15 border-moss-green/20 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold">
              <span className="bg-moss-green h-1.5 w-1.5 animate-ping rounded-full" />
              Speaking live
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onToggleVoiceOutput}
          className="text-slate hover:text-deep-ink border-deep-ink/10 inline-flex items-center gap-1.5 rounded-full border bg-white px-2.5 py-1 text-xs shadow-2xs transition-colors"
          title={
            isVoiceOutputEnabled ? 'Mute voice audio' : 'Enable voice audio'
          }
        >
          {isVoiceOutputEnabled ? (
            <>
              <Volume2 className="text-moss-green h-3.5 w-3.5" />
              <span className="text-[11px] font-medium">Voice on</span>
            </>
          ) : (
            <>
              <VolumeX className="text-slate h-3.5 w-3.5" />
              <span className="text-[11px] font-medium">Voice muted</span>
            </>
          )}
        </button>
      </div>

      <p className="text-deep-ink font-serif text-base leading-relaxed font-medium sm:text-xl sm:leading-8">
        "{assistantMessage}"
      </p>
    </div>
  );
}
