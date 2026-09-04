'use client'

import { Suspense } from 'react'
import { IntakeHeader } from '@/components/intake/intake-header'
import { AssistantPromptBox } from '@/components/intake/assistant-prompt-box'
import { StatusLanguageGrid } from '@/components/intake/status-language-grid'
import { AudioWaveform } from '@/components/intake/audio-waveform'
import { IntakeControls } from '@/components/intake/intake-controls'
import { CapturedFieldsSummary } from '@/components/intake/captured-fields-summary'
import { ConversationLog } from '@/components/intake/conversation-log'
import { useIntakeVoice } from '@/lib/hooks/use-intake-voice'

const defaultPrompt = 'Tap the microphone and answer in your own words.'

export default function PatientIntakePage() {
  return (
    <Suspense fallback={<div className="space-y-6 min-h-screen bg-canvas" />}>
      <PatientIntakeContent />
    </Suspense>
  )
}

function PatientIntakeContent() {
  const {
    isRecording,
    isListening,
    isSubmitting,
    isComplete,
    isVoiceOutputEnabled,
    setIsVoiceOutputEnabled,
    isSpeaking,
    assistantMessage,
    detectedLanguage,
    draft,
    chatItems,
    error,
    transcriptPreview,
    supportMessage,
    toggleMic,
    sendTranscript,
    resetConversation,
  } = useIntakeVoice()

  return (
    <div className="min-h-screen bg-canvas text-deep-ink">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-4 sm:py-6 sm:px-6 lg:px-8">
        <IntakeHeader />

        <main className="grid flex-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl border border-deep-ink/10 bg-white p-4 sm:p-6 shadow-sm">
            <div className="flex h-full flex-col justify-between gap-6">
              <div className="space-y-4">
                <AssistantPromptBox
                  assistantMessage={assistantMessage}
                  isSpeaking={isSpeaking}
                  isVoiceOutputEnabled={isVoiceOutputEnabled}
                  onToggleVoiceOutput={() => setIsVoiceOutputEnabled((prev) => !prev)}
                />

                <StatusLanguageGrid
                  detectedLanguage={detectedLanguage}
                  isSubmitting={isSubmitting}
                  isRecording={isRecording}
                  isComplete={isComplete}
                />

                {supportMessage && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900">
                    {supportMessage}
                  </div>
                )}

                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
                    {error}
                  </div>
                )}

                <AudioWaveform
                  isRecording={isRecording}
                  isListening={isListening}
                  transcriptPreview={transcriptPreview}
                  defaultPrompt={defaultPrompt}
                />
              </div>

              <IntakeControls
                isRecording={isRecording}
                isSubmitting={isSubmitting}
                onToggleMic={toggleMic}
                onSubmitText={(txt) => void sendTranscript(txt)}
                onReset={resetConversation}
              />
            </div>
          </section>

          <aside className="space-y-4 sm:space-y-6">
            <CapturedFieldsSummary draft={draft} />
            <ConversationLog items={chatItems} />
          </aside>
        </main>

        <footer className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 text-[11px] sm:text-xs text-slate text-center sm:text-left">
          <p>Speak naturally. You can switch languages mid-conversation.</p>
          <p>{isComplete ? 'Ready for confirmation.' : 'Keep talking until Noa confirms your intake.'}</p>
        </footer>
      </div>
    </div>
  )
}
