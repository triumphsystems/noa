import type { IntakeConversationDraft } from '@/lib/voice-types'

interface ConversationEntry {
  id: string
  role: 'assistant' | 'patient' | 'system'
  text: string
}

interface IntakeSidebarProps {
  chatItems: ConversationEntry[]
  draft: IntakeConversationDraft
  canPersist: boolean
  isComplete: boolean
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl bg-canvas px-4 py-3">
      <span className="text-slate">{label}</span>
      <span className="text-right font-medium text-deep-ink">{value}</span>
    </div>
  )
}

export function IntakeSidebar({ chatItems, draft, canPersist, isComplete }: IntakeSidebarProps) {
  return (
    <aside className="space-y-6">
      <div className="rounded-[2rem] border border-deep-ink/10 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold font-serif mb-4">Conversation</h2>
        <div className="space-y-4">
          {chatItems.map(item => (
            <div
              key={item.id}
              className={`rounded-3xl px-4 py-3 text-sm leading-6 ${
                item.role === 'assistant'
                  ? 'bg-soft-meadow/50 text-deep-ink'
                  : 'bg-canvas text-deep-ink border border-deep-ink/10'
              }`}
            >
              <p className="mb-1 text-xs uppercase tracking-[0.25em] text-slate">{item.role}</p>
              <p>{item.text}</p>
            </div>
          ))}
          {chatItems.length === 0 && (
            <div className="rounded-3xl border border-dashed border-deep-ink/15 p-6 text-sm text-slate">
              Conversation will appear as Noa asks questions.
            </div>
          )}
        </div>
      </div>

      <div className="rounded-[2rem] border border-deep-ink/10 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold font-serif mb-4">Captured so far</h2>
        <div className="space-y-3 text-sm">
          <Row label="Name" value={`${draft.firstName || '—'} ${draft.lastName || ''}`.trim()} />
          <Row label="DOB" value={draft.dateOfBirth || '—'} />
          <Row label="Email" value={draft.email || '—'} />
          <Row label="Phone" value={draft.phone || '—'} />
          <Row label="Conditions" value={draft.medicalConditions?.join(', ') || '—'} />
          <Row label="Allergies" value={draft.allergies?.join(', ') || '—'} />
          <Row label="Emergency contact" value={draft.emergencyContactName || '—'} />
        </div>
      </div>

      <div className="rounded-[2rem] border border-hi-yellow/30 bg-hi-yellow/10 p-6">
        <h2 className="text-lg font-semibold font-serif mb-2">Next step</h2>
        <p className="text-sm text-deep-ink leading-6">
          {canPersist ? 'We can save the intake once complete.' : ''}
        </p>
      </div>
    </aside>
  )
}
