'use client';

import * as React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Check,
  Copy,
  FileCheck,
  Save,
  Edit3,
  Loader2,
  Sparkles,
} from 'lucide-react';

export interface SOAPNoteData {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

interface SoapNoteCardProps {
  soapNote: SOAPNoteData | null;
  isGenerating?: boolean;
  isSaving?: boolean;
  onSave?: (note?: SOAPNoteData) => void;
  onUpdateNote?: (note: SOAPNoteData) => void;
  className?: string;
}

export function SoapNoteCard({
  soapNote,
  isGenerating,
  isSaving,
  onSave,
  onUpdateNote,
  className,
}: SoapNoteCardProps) {
  const [copied, setCopied] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [localNote, setLocalNote] = React.useState<SOAPNoteData>({
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
  });

  React.useEffect(() => {
    if (soapNote) {
      setLocalNote(soapNote);
    }
  }, [soapNote]);

  const handleCopy = () => {
    const active = soapNote || localNote;
    const text = `S (Subjective):\n${active.subjective}\n\nO (Objective):\n${active.objective}\n\nA (Assessment):\n${active.assessment}\n\nP (Plan):\n${active.plan}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFieldChange = (field: keyof SOAPNoteData, value: string) => {
    const updated = { ...localNote, [field]: value };
    setLocalNote(updated);
    if (onUpdateNote) {
      onUpdateNote(updated);
    }
  };

  return (
    <Card
      className={`border-deep-ink/8 shadow-editorial border bg-white font-sans ${className || ''}`}
    >
      <CardHeader className="border-deep-ink/5 border-b pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-emerald-700" />
            <CardTitle className="text-base">
              Clinical SOAP Assessment
            </CardTitle>
          </div>
          {soapNote && (
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="h-7 cursor-pointer gap-1 rounded-full px-2.5 text-[11px]"
              >
                <Edit3 className="h-3 w-3" />
                {isEditing ? 'Preview' : 'Edit'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="h-7 cursor-pointer gap-1 rounded-full px-2.5 text-[11px]"
              >
                {copied ? (
                  <Check className="h-3 w-3 text-emerald-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-4 font-sans">
        {isGenerating ? (
          <div className="text-slate bg-canvas/40 border-deep-ink/10 space-y-3 rounded-xl border border-dashed p-8 text-center text-xs">
            <div className="mx-auto flex h-8 w-8 animate-spin items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <Sparkles className="h-4 w-4" />
            </div>
            <p className="text-deep-ink font-medium">
              Synthesizing clinical consultation...
            </p>
            <p className="text-slate mx-auto max-w-xs">
              Nova AI is parsing speech history into structured Subjective,
              Objective, Assessment, and Plan notes.
            </p>
          </div>
        ) : !soapNote ? (
          <div className="bg-canvas/40 border-deep-ink/10 text-slate space-y-2 rounded-xl border border-dashed p-6 text-center">
            <FileCheck className="text-slate/40 mx-auto h-5 w-5" />
            <p className="text-deep-ink text-xs font-semibold">
              No SOAP Note Generated Yet
            </p>
            <p className="text-slate mx-auto max-w-sm text-xs leading-relaxed">
              When consultation recording ends, Bedrock Nova AI will
              automatically compile clinical documentation structured into
              S-O-A-P sections for physician sign-off.
            </p>
          </div>
        ) : isEditing ? (
          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate mb-1 block text-[11px] font-semibold tracking-wider uppercase">
                Subjective
              </label>
              <textarea
                value={localNote.subjective}
                onChange={(e) =>
                  handleFieldChange('subjective', e.target.value)
                }
                rows={2}
                className="border-deep-ink/15 text-deep-ink focus:ring-deep-ink w-full rounded-lg border bg-white p-2.5 text-xs focus:ring-1 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-slate mb-1 block text-[11px] font-semibold tracking-wider uppercase">
                Objective
              </label>
              <textarea
                value={localNote.objective}
                onChange={(e) => handleFieldChange('objective', e.target.value)}
                rows={2}
                className="border-deep-ink/15 text-deep-ink focus:ring-deep-ink w-full rounded-lg border bg-white p-2.5 text-xs focus:ring-1 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-slate mb-1 block text-[11px] font-semibold tracking-wider uppercase">
                Assessment
              </label>
              <textarea
                value={localNote.assessment}
                onChange={(e) =>
                  handleFieldChange('assessment', e.target.value)
                }
                rows={2}
                className="border-deep-ink/15 text-deep-ink focus:ring-deep-ink w-full rounded-lg border bg-white p-2.5 text-xs focus:ring-1 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-slate mb-1 block text-[11px] font-semibold tracking-wider uppercase">
                Plan
              </label>
              <textarea
                value={localNote.plan}
                onChange={(e) => handleFieldChange('plan', e.target.value)}
                rows={2}
                className="border-deep-ink/15 text-deep-ink focus:ring-deep-ink w-full rounded-lg border bg-white p-2.5 text-xs focus:ring-1 focus:outline-none"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2.5 text-xs">
            <div className="bg-soft-meadow/50 border-deep-ink/6 rounded-xl border p-3">
              <span className="text-deep-ink mb-0.5 block font-serif text-[11px] font-bold tracking-wider uppercase">
                Subjective
              </span>
              <p className="text-deep-ink text-xs leading-relaxed whitespace-pre-wrap">
                {soapNote.subjective}
              </p>
            </div>

            <div className="bg-soft-meadow/50 border-deep-ink/6 rounded-xl border p-3">
              <span className="text-deep-ink mb-0.5 block font-serif text-[11px] font-bold tracking-wider uppercase">
                Objective
              </span>
              <p className="text-deep-ink text-xs leading-relaxed whitespace-pre-wrap">
                {soapNote.objective}
              </p>
            </div>

            <div className="bg-soft-meadow/50 border-deep-ink/6 rounded-xl border p-3">
              <span className="text-deep-ink mb-0.5 block font-serif text-[11px] font-bold tracking-wider uppercase">
                Assessment
              </span>
              <p className="text-deep-ink text-xs leading-relaxed whitespace-pre-wrap">
                {soapNote.assessment}
              </p>
            </div>

            <div className="bg-soft-meadow/50 border-deep-ink/6 rounded-xl border p-3">
              <span className="text-deep-ink mb-0.5 block font-serif text-[11px] font-bold tracking-wider uppercase">
                Plan
              </span>
              <p className="text-deep-ink text-xs leading-relaxed whitespace-pre-wrap">
                {soapNote.plan}
              </p>
            </div>
          </div>
        )}
      </CardContent>

      {soapNote && onSave && (
        <CardFooter className="border-deep-ink/5 border-t pt-3">
          <Button
            onClick={() => onSave(localNote)}
            disabled={isSaving}
            className="bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 h-10 w-full cursor-pointer gap-2 rounded-full py-2.5 text-xs font-semibold shadow-2xs"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSaving
              ? 'Saving session to patient chart...'
              : 'Save Consultation Record'}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
