interface IntakeInfoPanelsProps {
  assistantMessage: string
  detectedLanguage: string
  isSubmitting: boolean
  isRecording: boolean
  isComplete: boolean
  supportMessage: string
  error: string
  transcriptPreview: string
  isListening: boolean
}

export function IntakeInfoPanels({
  assistantMessage,
  detectedLanguage,
  isSubmitting,
  isRecording,
  isComplete,
  supportMessage,
  error,
  transcriptPreview,
  isListening,
}: IntakeInfoPanelsProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-soft-meadow/50 p-5">
        <p className="text-xs uppercase tracking-[0.3em] text-slate mb-3">Noa says</p>
        <p className="text-xl font-medium leading-8 text-deep-ink">{assistantMessage}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-deep-ink/10 bg-canvas p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-slate mb-2">Detected language</p>
          <p className="font-medium text-deep-ink">{detectedLanguage}</p>
        </div>
        <div className="rounded-3xl border border-deep-ink/10 bg-canvas p-4">
          <p className="text-xs uppercase tracking-[0.25em] text-slate mb-2">Status</p>
          <p className="font-medium text-deep-ink">
            {isSubmitting ? 'Processing' : isRecording ? 'Listening' : isComplete ? 'Complete' : 'Ready'}
          </p>
        </div>
      </div>

      {supportMessage && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {supportMessage}
        </div>
      )}

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-3xl border border-deep-ink/10 bg-canvas p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-slate mb-3">Live transcript</p>
        <p className="min-h-24 text-base leading-7 text-deep-ink">
          {transcriptPreview || 'Tap the microphone and answer in your own words.'}
        </p>
      </div>

      <p className="text-xs uppercase tracking-[0.25em] text-slate">
        {isRecording ? (isListening ? 'Listening live' : 'Starting microphone') : 'Mic idle'}
      </p>
    </div>
  )
}
