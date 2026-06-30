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
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <IntakeHeader />

        <main className="grid flex-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[2rem] border border-deep-ink/10 bg-white p-6 shadow-sm">
            <div className="flex h-full flex-col justify-between gap-6">
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

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={state.handleMicPress}
                  disabled={state.isSubmitting}
                  className={`flex-1 rounded-full px-6 py-4 text-base font-semibold ${
                    state.speechControls.isRecording
                      ? 'bg-deep-ink text-white hover:bg-deep-ink/90'
                      : 'bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90'
                  }`}
                >
                  <span className="mr-2 inline-flex h-3 w-3 rounded-full bg-current opacity-70" />
                  {state.speechControls.isRecording ? 'Stop microphone' : 'Start microphone'}
                </Button>
                <Button
                  variant="outline"
                  onClick={state.skipToText}
                  className="rounded-full border-deep-ink/20 text-deep-ink hover:bg-soft-meadow"
                >
                  Type fallback
                </Button>
                <Button
                  variant="outline"
                  onClick={state.resetConversation}
                  className="rounded-full border-deep-ink/20 text-deep-ink hover:bg-soft-meadow"
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

        <footer className="mt-6 flex items-center justify-between gap-4 text-xs text-slate">
          <p>Speak naturally. Switch languages mid-conversation.</p>
          <p>{state.isComplete ? 'Ready for confirmation.' : 'Keep talking until done.'}</p>
        </footer>
      </div>
    </div>
  )
}
