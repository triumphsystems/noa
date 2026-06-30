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
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-8 sm:px-6 lg:px-8">
        <IntakeHeader />

        <main className="grid flex-1 gap-8 lg:grid-cols-[1.5fr_1fr]">
          {/* Main Intake Panel */}
          <section className="rounded-3xl border border-deep-ink/10 bg-white p-8 shadow-lg">
            <div className="flex h-full flex-col justify-between gap-8">
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

              <div className="flex flex-col gap-3">
                <Button
                  onClick={state.handleMicPress}
                  disabled={state.isSubmitting}
                  className={`w-full rounded-xl px-6 py-4 text-base font-semibold transition-all ${
                    state.speechControls.isRecording
                      ? 'bg-red-500 text-white hover:bg-red-600 shadow-lg'
                      : 'bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 shadow-md'
                  }`}
                >
                  <span className="mr-2 inline-flex h-2.5 w-2.5 rounded-full bg-current" />
                  {state.speechControls.isRecording ? 'Stop Recording' : 'Start Recording'}
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={state.skipToText}
                    className="rounded-lg border-deep-ink/20 text-deep-ink hover:bg-soft-meadow"
                  >
                    Type Instead
                  </Button>
                  <Button
                    variant="outline"
                    onClick={state.resetConversation}
                    className="rounded-lg border-deep-ink/20 text-deep-ink hover:bg-soft-meadow"
                  >
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Sidebar */}
          <div className="lg:sticky lg:top-8 lg:h-fit">
            <IntakeSidebar
              chatItems={state.chatItems}
              draft={state.draft}
              canPersist={state.canPersist}
              isComplete={state.isComplete}
            />
          </div>
        </main>

        <footer className="mt-12 pt-6 border-t border-deep-ink/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate">
          <p className="font-medium">💡 Speak naturally. Switch languages anytime.</p>
          <p className="font-medium px-4 py-2 rounded-full bg-soft-meadow/50">
            {state.isComplete ? '✓ Ready to review' : 'Keep going...'}
          </p>
        </footer>
      </div>
    </div>
  )
}
