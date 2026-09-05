'use client'

import * as React from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Copy, FileCheck, Save, Edit3, Loader2, Sparkles } from 'lucide-react'

export interface SOAPNoteData {
  subjective: string
  objective: string
  assessment: string
  plan: string
}

interface SoapNoteCardProps {
  soapNote: SOAPNoteData | null
  isGenerating?: boolean
  isSaving?: boolean
  onSave?: (note?: SOAPNoteData) => void
  onUpdateNote?: (note: SOAPNoteData) => void
  className?: string
}

export function SoapNoteCard({
  soapNote,
  isGenerating,
  isSaving,
  onSave,
  onUpdateNote,
  className,
}: SoapNoteCardProps) {
  const [copied, setCopied] = React.useState(false)
  const [isEditing, setIsEditing] = React.useState(false)
  const [localNote, setLocalNote] = React.useState<SOAPNoteData>({
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
  })

  React.useEffect(() => {
    if (soapNote) {
      setLocalNote(soapNote)
    }
  }, [soapNote])

  const handleCopy = () => {
    const active = soapNote || localNote
    const text = `S (Subjective):\n${active.subjective}\n\nO (Objective):\n${active.objective}\n\nA (Assessment):\n${active.assessment}\n\nP (Plan):\n${active.plan}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleFieldChange = (field: keyof SOAPNoteData, value: string) => {
    const updated = { ...localNote, [field]: value }
    setLocalNote(updated)
    if (onUpdateNote) {
      onUpdateNote(updated)
    }
  }

  return (
    <Card className={`border border-deep-ink/8 bg-white shadow-editorial font-sans ${className || ''}`}>
      <CardHeader className="pb-3 border-b border-deep-ink/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-emerald-700" />
            <CardTitle className="text-base">Clinical SOAP Assessment</CardTitle>
          </div>
          {soapNote && (
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
                className="rounded-full h-7 px-2.5 gap-1 text-[11px] cursor-pointer"
              >
                <Edit3 className="h-3 w-3" />
                {isEditing ? 'Preview' : 'Edit'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="rounded-full h-7 px-2.5 gap-1 text-[11px] cursor-pointer"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-4 font-sans">
        {isGenerating ? (
          <div className="p-8 text-center text-slate text-xs space-y-3 bg-canvas/40 rounded-xl border border-dashed border-deep-ink/10">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center mx-auto text-amber-700 animate-spin">
              <Sparkles className="w-4 h-4" />
            </div>
            <p className="font-medium text-deep-ink">Synthesizing clinical consultation...</p>
            <p className="text-slate max-w-xs mx-auto">
              Nova AI is parsing speech history into structured Subjective, Objective, Assessment, and Plan notes.
            </p>
          </div>
        ) : !soapNote ? (
          <div className="p-6 text-center bg-canvas/40 rounded-xl border border-dashed border-deep-ink/10 text-slate space-y-2">
            <FileCheck className="h-5 w-5 text-slate/40 mx-auto" />
            <p className="text-xs font-semibold text-deep-ink">No SOAP Note Generated Yet</p>
            <p className="text-xs text-slate max-w-sm mx-auto leading-relaxed">
              When consultation recording ends, Bedrock Nova AI will automatically compile clinical documentation structured into S-O-A-P sections for physician sign-off.
            </p>
          </div>
        ) : isEditing ? (
          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate block mb-1">
                Subjective
              </label>
              <textarea
                value={localNote.subjective}
                onChange={e => handleFieldChange('subjective', e.target.value)}
                rows={2}
                className="w-full p-2.5 border border-deep-ink/15 rounded-lg text-deep-ink focus:outline-none focus:ring-1 focus:ring-deep-ink text-xs bg-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate block mb-1">
                Objective
              </label>
              <textarea
                value={localNote.objective}
                onChange={e => handleFieldChange('objective', e.target.value)}
                rows={2}
                className="w-full p-2.5 border border-deep-ink/15 rounded-lg text-deep-ink focus:outline-none focus:ring-1 focus:ring-deep-ink text-xs bg-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate block mb-1">
                Assessment
              </label>
              <textarea
                value={localNote.assessment}
                onChange={e => handleFieldChange('assessment', e.target.value)}
                rows={2}
                className="w-full p-2.5 border border-deep-ink/15 rounded-lg text-deep-ink focus:outline-none focus:ring-1 focus:ring-deep-ink text-xs bg-white"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate block mb-1">
                Plan
              </label>
              <textarea
                value={localNote.plan}
                onChange={e => handleFieldChange('plan', e.target.value)}
                rows={2}
                className="w-full p-2.5 border border-deep-ink/15 rounded-lg text-deep-ink focus:outline-none focus:ring-1 focus:ring-deep-ink text-xs bg-white"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2.5 text-xs">
            <div className="bg-soft-meadow/50 rounded-xl p-3 border border-deep-ink/6">
              <span className="text-[11px] font-bold font-serif text-deep-ink uppercase tracking-wider block mb-0.5">
                Subjective
              </span>
              <p className="text-deep-ink text-xs leading-relaxed whitespace-pre-wrap">{soapNote.subjective}</p>
            </div>

            <div className="bg-soft-meadow/50 rounded-xl p-3 border border-deep-ink/6">
              <span className="text-[11px] font-bold font-serif text-deep-ink uppercase tracking-wider block mb-0.5">
                Objective
              </span>
              <p className="text-deep-ink text-xs leading-relaxed whitespace-pre-wrap">{soapNote.objective}</p>
            </div>

            <div className="bg-soft-meadow/50 rounded-xl p-3 border border-deep-ink/6">
              <span className="text-[11px] font-bold font-serif text-deep-ink uppercase tracking-wider block mb-0.5">
                Assessment
              </span>
              <p className="text-deep-ink text-xs leading-relaxed whitespace-pre-wrap">{soapNote.assessment}</p>
            </div>

            <div className="bg-soft-meadow/50 rounded-xl p-3 border border-deep-ink/6">
              <span className="text-[11px] font-bold font-serif text-deep-ink uppercase tracking-wider block mb-0.5">
                Plan
              </span>
              <p className="text-deep-ink text-xs leading-relaxed whitespace-pre-wrap">{soapNote.plan}</p>
            </div>
          </div>
        )}
      </CardContent>

      {soapNote && onSave && (
        <CardFooter className="pt-3 border-t border-deep-ink/5">
          <Button
            onClick={() => onSave(localNote)}
            disabled={isSaving}
            className="w-full rounded-full font-semibold gap-2 text-xs py-2.5 h-10 shadow-2xs bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 cursor-pointer"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isSaving ? 'Saving session to patient chart...' : 'Save Consultation Record'}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
