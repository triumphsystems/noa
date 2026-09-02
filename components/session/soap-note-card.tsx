'use client'

import * as React from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Copy, FileCheck, Save } from 'lucide-react'

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
  onSave?: () => void
  className?: string
}

export function SoapNoteCard({
  soapNote,
  isGenerating,
  isSaving,
  onSave,
  className,
}: SoapNoteCardProps) {
  const [copied, setCopied] = React.useState(false)

  if (!soapNote && !isGenerating) {
    return null
  }

  const handleCopy = () => {
    if (!soapNote) return
    const text = `S (Subjective):\n${soapNote.subjective}\n\nO (Objective):\n${soapNote.objective}\n\nA (Assessment):\n${soapNote.assessment}\n\nP (Plan):\n${soapNote.plan}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-deep-ink" />
            <CardTitle className="text-lg">Generated SOAP Note</CardTitle>
          </div>
          {soapNote && (
            <Button
              variant="outline"
              size="xs"
              onClick={handleCopy}
              className="rounded-full gap-1 text-xs"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isGenerating ? (
          <div className="p-8 text-center text-slate text-sm space-y-2">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-deep-ink/20 border-t-deep-ink mb-2" />
            <p>Nova is synthesizing session notes...</p>
          </div>
        ) : soapNote ? (
          <div className="space-y-3 text-sm">
            <div className="bg-soft-meadow/50 rounded-2xl p-3 border border-deep-ink/5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate block mb-1">
                Subjective
              </span>
              <p className="text-deep-ink leading-relaxed">{soapNote.subjective}</p>
            </div>

            <div className="bg-soft-meadow/50 rounded-2xl p-3 border border-deep-ink/5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate block mb-1">
                Objective
              </span>
              <p className="text-deep-ink leading-relaxed">{soapNote.objective}</p>
            </div>

            <div className="bg-soft-meadow/50 rounded-2xl p-3 border border-deep-ink/5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate block mb-1">
                Assessment
              </span>
              <p className="text-deep-ink leading-relaxed">{soapNote.assessment}</p>
            </div>

            <div className="bg-soft-meadow/50 rounded-2xl p-3 border border-deep-ink/5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate block mb-1">
                Plan
              </span>
              <p className="text-deep-ink leading-relaxed">{soapNote.plan}</p>
            </div>
          </div>
        ) : null}
      </CardContent>

      {soapNote && onSave && (
        <CardFooter className="pt-2">
          <Button
            onClick={onSave}
            disabled={isSaving}
            className="w-full rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 font-semibold gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving session...' : 'Save Consultation Record'}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
