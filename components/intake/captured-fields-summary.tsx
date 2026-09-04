'use client'

import type { IntakeConversationDraft } from '@/lib/voice-service'
import { CheckCircle2, Clock } from 'lucide-react'

type CapturedFieldsSummaryProps = {
  draft: IntakeConversationDraft
}

export function CapturedFieldsSummary({ draft }: CapturedFieldsSummaryProps) {
  const fields = [
    { label: 'Full Name', value: `${draft.firstName || ''} ${draft.lastName || ''}`.trim() },
    { label: 'Date of Birth', value: draft.dateOfBirth },
    { label: 'Email', value: draft.email },
    { label: 'Phone', value: draft.phone },
    { label: 'Conditions', value: draft.medicalConditions?.join(', ') },
    { label: 'Allergies', value: draft.allergies?.join(', ') },
    { label: 'Emergency Contact', value: draft.emergencyContactName },
  ]

  const capturedCount = fields.filter((f) => Boolean(f.value && f.value.trim())).length
  const percentComplete = Math.round((capturedCount / fields.length) * 100)

  return (
    <div className="rounded-3xl border border-deep-ink/10 bg-white p-4 sm:p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold font-serif text-deep-ink">Captured Information</h2>
        <span className="text-xs font-semibold text-deep-ink bg-hi-yellow/30 px-2 py-0.5 rounded-full border border-hi-yellow/60">
          {capturedCount} of {fields.length} ({percentComplete}%)
        </span>
      </div>

      <div className="w-full bg-soft-meadow rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-deep-ink h-full transition-all duration-300 rounded-full"
          style={{ width: `${percentComplete}%` }}
        />
      </div>

      <div className="space-y-2 text-xs sm:text-sm">
        {fields.map((field) => {
          const isCaptured = Boolean(field.value && field.value.trim())
          return (
            <div
              key={field.label}
              className="flex items-start justify-between gap-3 rounded-xl bg-canvas px-3.5 py-2.5 transition-colors"
            >
              <div className="flex items-center gap-2">
                {isCaptured ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-moss-green shrink-0" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-slate/40 shrink-0" />
                )}
                <span className={isCaptured ? 'text-deep-ink font-medium' : 'text-slate'}>
                  {field.label}
                </span>
              </div>
              <span
                className={`text-right font-medium max-w-[55%] truncate ${
                  isCaptured ? 'text-deep-ink' : 'text-slate/40 italic'
                }`}
              >
                {field.value || 'Pending'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
