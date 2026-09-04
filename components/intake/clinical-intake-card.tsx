'use client'

import { useState } from 'react'
import type { IntakeConversationDraft } from '@/lib/voice-service'
import { CheckCircle2, Clock, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react'

type RightPanelProps = {
  draft: IntakeConversationDraft
  chatItems: Array<{ id: string; role: 'assistant' | 'patient' | 'system'; text: string }>
}

export function ClinicalIntakeCard({ draft, chatItems }: RightPanelProps) {
  const [showHistory, setShowHistory] = useState(false)

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
    <div className="h-full flex flex-col justify-between rounded-3xl border border-deep-ink/10 bg-white p-4 shadow-sm overflow-hidden">
      {/* Header & Progress */}
      <div className="space-y-2 pb-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold font-serif text-deep-ink">Captured Information</h2>
          <span className="text-[11px] font-bold text-deep-ink bg-hi-yellow/35 px-2 py-0.5 rounded-full border border-hi-yellow/60">
            {capturedCount} of {fields.length} ({percentComplete}%)
          </span>
        </div>

        <div className="w-full bg-soft-meadow rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-deep-ink h-full transition-all duration-300 rounded-full"
            style={{ width: `${percentComplete}%` }}
          />
        </div>
      </div>

      {/* Extracted Fields Table */}
      <div className="flex-1 space-y-1.5 overflow-y-auto py-1">
        {fields.map((field) => {
          const isCaptured = Boolean(field.value && field.value.trim())
          return (
            <div
              key={field.label}
              className="flex items-center justify-between gap-2 rounded-xl bg-canvas px-3 py-1.5 text-xs transition-colors"
            >
              <div className="flex items-center gap-1.5 shrink-0">
                {isCaptured ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-moss-green" />
                ) : (
                  <Clock className="w-3.5 h-3.5 text-slate/40" />
                )}
                <span className={isCaptured ? 'text-deep-ink font-medium' : 'text-slate'}>
                  {field.label}
                </span>
              </div>
              <span
                className={`text-right font-medium truncate max-w-[55%] ${
                  isCaptured ? 'text-deep-ink' : 'text-slate/40 italic'
                }`}
              >
                {field.value || 'Pending'}
              </span>
            </div>
          )
        })}
      </div>

      {/* History Drawer Toggle at Bottom */}
      <div className="pt-2 border-t border-deep-ink/8">
        <button
          type="button"
          onClick={() => setShowHistory(!showHistory)}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-soft-meadow/50 hover:bg-soft-meadow text-xs text-slate hover:text-deep-ink transition-colors"
        >
          <span className="flex items-center gap-1.5 font-medium text-[11px]">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Dialogue History ({chatItems.length})</span>
          </span>
          {showHistory ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>

        {showHistory && (
          <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {chatItems.map((item) => (
              <div
                key={item.id}
                className={`rounded-lg px-2.5 py-1.5 text-[11px] leading-snug ${
                  item.role === 'assistant'
                    ? 'bg-soft-meadow/70 text-deep-ink'
                    : 'bg-canvas text-deep-ink border border-deep-ink/10'
                }`}
              >
                <span className="font-semibold text-[10px] block text-slate uppercase">
                  {item.role === 'assistant' ? 'Noa' : 'You'}
                </span>
                <span>{item.text}</span>
              </div>
            ))}
            {chatItems.length === 0 && (
              <p className="text-[11px] text-slate/60 text-center py-2 italic">No messages yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
