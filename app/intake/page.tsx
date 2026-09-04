'use client'

import { Suspense } from 'react'
import { IntakeHeader } from '@/components/intake/intake-header'
import { AssistantPromptBox } from '@/components/intake/assistant-prompt-box'
import { VoiceStudio } from '@/components/intake/voice-studio'
import { ClinicalIntakeCard } from '@/components/intake/clinical-intake-card'
import { useIntakeVoice } from '@/lib/hooks/use-intake-voice'

const defaultPrompt = 'Tap the microphone or start speaking in your preferred language.'

export default function PatientIntakePage() {
  return (
    <Suspense fallback={<div className="h-screen bg-canvas" />}>
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
    <div className="h-screen max-h-screen overflow-hidden bg-canvas text-deep-ink flex flex-col justify-between p-3 sm:p-5">
      <div className="mx-auto w-full max-w-6xl h-full flex flex-col gap-3">
        {/* Sleek Top Header with embedded Telemetry */}
        <IntakeHeader
          detectedLanguage={detectedLanguage}
          isSubmitting={isSubmitting}
          isRecording={isRecording}
          isComplete={isComplete}
        />

        {/* Global Warnings / Messages */}
        {supportMessage && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-900 shrink-0">
            {supportMessage}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700 shrink-0">
            {error}
          </div>
        )}

        {/* Two-Column Studio Layout (100% Fit, Zero-Scroll) */}
        <main className="grid flex-1 gap-3.5 sm:gap-5 lg:grid-cols-[1.3fr_0.9fr] min-h-0 overflow-hidden">
          {/* Left Column: Interactive Voice Canvas */}
          <section className="h-full flex flex-col gap-3 rounded-3xl border border-deep-ink/10 bg-white p-3.5 sm:p-4 shadow-sm min-h-0 overflow-hidden">
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

          {/* Right Column: Live Clinical Card & History Drawer */}
          <aside className="h-full min-h-0 overflow-hidden">
            <ClinicalIntakeCard draft={draft} chatItems={chatItems} />
          </aside>
        </main>

        {/* Micro Footer Bar */}
        <footer className="shrink-0 flex items-center justify-between text-[11px] text-slate/80 px-1 pt-1 border-t border-deep-ink/5">
          <span>Speak naturally. Switch languages any time.</span>
          <span>{isComplete ? 'Intake ready for confirmation.' : 'Noa asks one question at a time.'}</span>
        </footer>
      </div>
    </div>
  )
}
