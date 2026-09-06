'use client';

import { useState } from 'react';
import type { IntakeConversationDraft } from '@/lib/voice-service';
import {
  CheckCircle2,
  Clock,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

type RightPanelProps = {
  draft: IntakeConversationDraft;
  chatItems: Array<{
    id: string;
    role: 'assistant' | 'patient' | 'system';
    text: string;
  }>;
  isComplete?: boolean;
  isSubmitting?: boolean;
  onFinalize?: () => void;
};

export function ClinicalIntakeCard({
  draft,
  chatItems,
  isComplete,
  isSubmitting,
  onFinalize,
}: RightPanelProps) {
  const [showHistory, setShowHistory] = useState(false);

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
    <div className="border-deep-ink/10 flex h-full flex-col justify-between rounded-2xl border bg-white p-3 shadow-sm sm:rounded-3xl sm:p-4">
      {/* Header & Progress */}
      <div className="space-y-1.5 pb-2">
        <div className="flex items-center justify-between">
          <h2 className="text-deep-ink font-serif text-xs font-bold sm:text-sm">
            Captured Information
          </h2>
          <span className="text-deep-ink bg-hi-yellow/35 border-hi-yellow/60 rounded-full border px-2 py-0.5 text-[10px] font-bold sm:text-[11px]">
            {capturedCount} of {fields.length} ({percentComplete}%)
          </span>
        </div>

        <div className="bg-soft-meadow h-1.5 w-full overflow-hidden rounded-full">
          <div
            className="bg-deep-ink h-full rounded-full transition-all duration-300"
            style={{ width: `${percentComplete}%` }}
          />
        </div>

        {(percentComplete === 100 || isComplete) && onFinalize && (
          <button
            type="button"
            onClick={onFinalize}
            disabled={isSubmitting}
            className="bg-moss-green text-white hover:bg-moss-green/90 mt-2 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>
              {isComplete
                ? 'Intake Complete — Finalizing…'
                : 'Finalize Intake & View Summary'}
            </span>
          </button>
        )}
      </div>

      {/* Extracted Fields Table */}
      <div className="max-h-56 flex-1 space-y-1 overflow-y-auto py-1 sm:max-h-none sm:space-y-1.5">
        {fields.map((field) => {
          const isCaptured = Boolean(field.value && field.value.trim());
          return (
            <div
              key={field.label}
              className="bg-canvas flex items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-xs transition-colors sm:px-3"
            >
              <div className="flex shrink-0 items-center gap-1.5">
                {isCaptured ? (
                  <CheckCircle2 className="text-moss-green h-3.5 w-3.5" />
                ) : (
                  <Clock className="text-slate/40 h-3.5 w-3.5" />
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

      {/* History Drawer Toggle at Bottom */}
      <div className="border-deep-ink/8 shrink-0 border-t pt-2">
        <button
          type="button"
          onClick={() => setShowHistory(!showHistory)}
          className="bg-soft-meadow/50 hover:bg-soft-meadow text-slate hover:text-deep-ink flex w-full cursor-pointer items-center justify-between rounded-xl px-2.5 py-1.5 text-xs transition-colors"
        >
          <span className="flex items-center gap-1.5 text-[11px] font-medium">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Dialogue History ({chatItems.length})</span>
          </span>
          {showHistory ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronUp className="h-3.5 w-3.5" />
          )}
        </button>

        {showHistory && (
          <div className="mt-2 max-h-32 space-y-1.5 overflow-y-auto pr-1 sm:max-h-40">
            {chatItems.map((item) => (
              <div
                key={item.id}
                className={`rounded-lg px-2.5 py-1.5 text-[11px] leading-snug ${
                  item.role === 'assistant'
                    ? 'bg-soft-meadow/70 text-deep-ink'
                    : 'bg-canvas text-deep-ink border-deep-ink/10 border'
                }`}
              >
                <span className="text-slate block text-[10px] font-semibold uppercase">
                  {item.role === 'assistant' ? 'Noa' : 'You'}
                </span>
                <span>{item.text}</span>
              </div>
            ))}
            {chatItems.length === 0 && (
              <p className="text-slate/60 py-2 text-center text-[11px] italic">
                No messages yet.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
