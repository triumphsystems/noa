'use client'

import { Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { useIntakeContainer } from './intake-container'
import { IntakeHeader } from './intake-header'
import { IntakeInfoPanels } from './intake-info-panels'
import { IntakeSidebar } from './intake-sidebar'

export default function PatientIntakePage() {
  return (
    <Suspense fallback={<div className="space-y-6" />}>
      <PatientIntakeContent />
    </Suspense>
  )
}

function PatientIntakeContent() {
  const state = useIntakeContainer()

  return (
    <div className="min-h-screen bg-canvas text-deep-ink">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <IntakeHeader />

        <main className="grid flex-1 gap-6 lg:grid-cols-[1fr_360px]">
          {/* Primary interaction panel */}
          <section className="rounded-2xl border border-deep-ink/10 bg-white p-6 shadow-sm flex flex-col gap-6">
            <IntakeInfoPanels
              assistantMessage={state.assistantMessage}
              detectedLanguage={state.detectedLanguage}
              isSubmitting={state.isSubmitting}
              isRecording={state.speechControls.isRecording}
              isComplete={state.isComplete}
              supportMessage={state.speechControls.supportMessage}
              error={state.speechControls.error}
              transcriptPreview={state.speechControls.transcriptPreview}
              isListening={state.speechControls.isListening}
            />

            {/* Controls */}
            <div className="flex flex-col gap-2 mt-auto">
              <Button
                onClick={state.handleMicPress}
                disabled={state.isSubmitting}
                className={`w-full rounded-full py-5 text-base font-semibold transition-colors ${
                  state.speechControls.isRecording
                    ? 'bg-deep-ink text-white hover:bg-deep-ink/90'
                    : 'bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90'
                }`}
              >
                <span className={`mr-2.5 inline-flex h-2.5 w-2.5 rounded-full ${state.speechControls.isRecording ? 'bg-white animate-pulse' : 'bg-deep-ink/60'}`} />
                {state.speechControls.isRecording ? 'Stop microphone' : 'Start microphone'}
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={state.skipToText}
                  className="flex-1 rounded-full border-deep-ink/20 text-deep-ink hover:bg-soft-meadow text-sm"
                >
                  Type instead
                </Button>
                <Button
                  variant="outline"
                  onClick={state.resetConversation}
                  className="flex-1 rounded-full border-deep-ink/20 text-deep-ink hover:bg-soft-meadow text-sm"
                >
                  Reset
                </Button>
              </div>
            </div>
          </section>

          <IntakeSidebar
            chatItems={state.chatItems}
            draft={state.draft}
            canPersist={state.canPersist}
            isComplete={state.isComplete}
          />
        </main>

        <footer className="mt-6 flex items-center justify-between gap-4 text-xs text-slate border-t border-deep-ink/8 pt-4">
          <p>Speak naturally. You can switch languages at any point.</p>
          <p>{state.isComplete ? 'Ready for confirmation.' : 'Keep talking until done.'}</p>
        </footer>
      </div>
    </div>
  )
}
