'use client'

import { Suspense } from 'react'
import { IntakeHeader } from '@/components/intake/intake-header'
import { AssistantPromptBox } from '@/components/intake/assistant-prompt-box'
import { VoiceStudio } from '@/components/intake/voice-studio'
import { ClinicalIntakeCard } from '@/components/intake/clinical-intake-card'
import { ErrorAlert } from '@/components/ui/error-alert'
import { useIntakeVoice } from '@/lib/hooks/use-intake-voice'

const defaultPrompt = 'Tap the microphone or speak in your preferred language.'

export default function PatientIntakePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-canvas" />}>
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
    <div className="min-h-screen lg:h-screen lg:max-h-screen lg:overflow-hidden bg-canvas text-deep-ink flex flex-col justify-between p-2.5 sm:p-4 lg:p-5">
      <div className="mx-auto w-full max-w-6xl flex-1 flex flex-col gap-2.5 sm:gap-3 min-h-0">
        {/* Compact Responsive Header */}
        <IntakeHeader
          detectedLanguage={detectedLanguage}
          isSubmitting={isSubmitting}
          isRecording={isRecording}
          isComplete={isComplete}
        />

        {/* Global Warnings / Error Banner */}
        {supportMessage && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-900 shrink-0">
            {supportMessage}
          </div>
        )}

        {error && <ErrorAlert message={error} className="shrink-0" />}

        {/* Studio Layout: Stacked on mobile, 2-column on desktop */}
        <main className="grid flex-1 gap-2.5 sm:gap-3.5 lg:grid-cols-[1.25fr_0.95fr] min-h-0 overflow-y-auto lg:overflow-hidden">
          {/* Interactive Voice Canvas */}
          <section className="flex flex-col gap-2.5 rounded-2xl sm:rounded-3xl border border-deep-ink/10 bg-white p-3 sm:p-4 shadow-sm min-h-0">
            <AssistantPromptBox
              assistantMessage={assistantMessage}
              isSpeaking={isSpeaking}
              isVoiceOutputEnabled={isVoiceOutputEnabled}
              onToggleVoiceOutput={() => setIsVoiceOutputEnabled((prev) => !prev)}
            />

            <VoiceStudio
              isRecording={isRecording}
              isListening={isListening}
              isSubmitting={isSubmitting}
              transcriptPreview={transcriptPreview}
              defaultPrompt={defaultPrompt}
              onToggleMic={toggleMic}
              onSubmitText={(txt) => void sendTranscript(txt)}
              onReset={resetConversation}
            />
          </section>

          {/* Clinical Card & Collapsible Drawer */}
          <aside className="min-h-0 overflow-visible lg:overflow-hidden">
            <ClinicalIntakeCard draft={draft} chatItems={chatItems} />
          </aside>
        </main>

        {/* Responsive Micro Footer Bar */}
        <footer className="shrink-0 flex items-center justify-between text-[10px] sm:text-[11px] text-slate/70 px-1 pt-1 border-t border-deep-ink/5">
          <span className="truncate">Speak naturally in any language.</span>
          <span className="shrink-0">{isComplete ? 'Intake complete.' : 'Noa asks one question at a time.'}</span>
        </footer>
      </div>
    </div>
  )
}
