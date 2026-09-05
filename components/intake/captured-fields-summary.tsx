'use client';

import type { IntakeConversationDraft } from '@/lib/voice-service';
import { CheckCircle2, Clock } from 'lucide-react';

type CapturedFieldsSummaryProps = {
  draft: IntakeConversationDraft;
};

export function CapturedFieldsSummary({ draft }: CapturedFieldsSummaryProps) {
  const fields = [
    {
      label: 'Full Name',
      value: `${draft.firstName || ''} ${draft.lastName || ''}`.trim(),
    },
    { label: 'Date of Birth', value: draft.dateOfBirth },
    { label: 'Email', value: draft.email },
    { label: 'Phone', value: draft.phone },
    { label: 'Conditions', value: draft.medicalConditions?.join(', ') },
    { label: 'Allergies', value: draft.allergies?.join(', ') },
    { label: 'Emergency Contact', value: draft.emergencyContactName },
  ];

  const capturedCount = fields.filter((f) =>
    Boolean(f.value && f.value.trim())
  ).length;
  const percentComplete = Math.round((capturedCount / fields.length) * 100);

  return (
    <div className="border-deep-ink/10 space-y-4 rounded-3xl border bg-white p-4 shadow-sm sm:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-deep-ink font-serif text-base font-semibold">
          Captured Information
        </h2>
        <span className="text-deep-ink bg-hi-yellow/30 border-hi-yellow/60 rounded-full border px-2 py-0.5 text-xs font-semibold">
          {capturedCount} of {fields.length} ({percentComplete}%)
        </span>
      </div>

      <div className="bg-soft-meadow h-1.5 w-full overflow-hidden rounded-full">
        <div
          className="bg-deep-ink h-full rounded-full transition-all duration-300"
          style={{ width: `${percentComplete}%` }}
        />
      </div>

      <div className="space-y-2 text-xs sm:text-sm">
        {fields.map((field) => {
          const isCaptured = Boolean(field.value && field.value.trim());
          return (
            <div
              key={field.label}
              className="bg-canvas flex items-start justify-between gap-3 rounded-xl px-3.5 py-2.5 transition-colors"
            >
              <div className="flex items-center gap-2">
                {isCaptured ? (
                  <CheckCircle2 className="text-moss-green h-3.5 w-3.5 shrink-0" />
                ) : (
                  <Clock className="text-slate/40 h-3.5 w-3.5 shrink-0" />
                )}
                <span
                  className={
                    isCaptured ? 'text-deep-ink font-medium' : 'text-slate'
                  }
                >
                  {field.label}
                </span>
              </div>
              <span
                className={`max-w-[55%] truncate text-right font-medium ${
                  isCaptured ? 'text-deep-ink' : 'text-slate/40 italic'
                }`}
              >
                {field.value || 'Pending'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
