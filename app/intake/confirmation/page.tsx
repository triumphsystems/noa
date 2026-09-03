'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, ArrowRight, Home } from 'lucide-react'

type IntakeCompletionState = {
  summary?: string
  language?: string
  doctorId?: string
  patientId?: string
  draft?: {
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    medicalConditions?: string[]
    allergies?: string[]
    currentMedications?: string[]
  }
}

export default function ConfirmationPage() {
  const [completionState, setCompletionState] = useState<IntakeCompletionState | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const raw = window.sessionStorage.getItem('intake-completion')
    if (!raw) return

    try {
      setCompletionState(JSON.parse(raw) as IntakeCompletionState)
    } catch {
      setCompletionState(null)
    }
  }, [])

  const summary = completionState?.summary || 'Your intake conversation was completed and securely stored in the clinical database.'
  const patientName = [completionState?.draft?.firstName, completionState?.draft?.lastName].filter(Boolean).join(' ') || 'Patient'

  return (
    <div className="min-h-screen bg-canvas text-deep-ink flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-lg w-full text-center space-y-5 sm:space-y-6">
        <div className="flex justify-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-moss-green/20 border border-moss-green/30 rounded-full flex items-center justify-center shadow-xs">
            <CheckCircle2 className="w-8 h-8 sm:w-9 sm:h-9 text-deep-ink" />
          </div>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif mb-2 text-deep-ink">Intake Complete</h1>
          <p className="text-slate text-xs sm:text-sm">
            Thank you, {patientName}. Noa captured your health information conversationally and encrypted the intake securely.
          </p>
        </div>

        <Card className="p-4 sm:p-6 text-left space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold font-serif text-deep-ink text-sm sm:text-base">Conversation Summary</h3>
            {completionState?.language && (
              <Badge variant="secondary" className="text-[10px]">
                {completionState.language}
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate leading-relaxed bg-soft-meadow/50 p-3.5 sm:p-4 rounded-2xl border border-deep-ink/5">
            {summary}
          </p>
        </Card>

        <Card className="bg-soft-meadow border-deep-ink/10 p-4 sm:p-6 text-left">
          <h3 className="font-semibold font-serif text-deep-ink mb-3 text-sm sm:text-base">What Happens Next?</h3>
          <ol className="space-y-2.5 text-xs sm:text-sm text-slate">
            <li className="flex gap-3 items-start">
              <span className="w-5 h-5 rounded-full bg-hi-yellow flex items-center justify-center text-xs font-bold text-deep-ink shrink-0 mt-0.5">
                1
              </span>
              <span>Your medical intake is ready for your clinician's review.</span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="w-5 h-5 rounded-full bg-hi-yellow flex items-center justify-center text-xs font-bold text-deep-ink shrink-0 mt-0.5">
                2
              </span>
              <span>Your doctor can access the structured intake and synthesized findings.</span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="w-5 h-5 rounded-full bg-hi-yellow flex items-center justify-center text-xs font-bold text-deep-ink shrink-0 mt-0.5">
                3
              </span>
              <span>Access your patient portal to review your consultation records.</span>
            </li>
          </ol>
        </Card>

        <div className="space-y-3">
          <Link href="/dashboard/patient" className="block">
            <Button className="w-full rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 py-5 font-semibold gap-2">
              <span>Go to Patient Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/" className="block">
            <Button variant="outline" className="w-full rounded-full border-deep-ink/20 text-deep-ink hover:bg-soft-meadow py-5 font-medium gap-2">
              <Home className="w-4 h-4" />
              <span>Return to Home</span>
            </Button>
          </Link>
        </div>

        <p className="text-xs text-slate pt-2">
          Questions or need assistance? Contact{' '}
          <a href="mailto:support@noa.health" className="font-semibold text-deep-ink underline">
            support@noa.health
          </a>
        </p>
      </div>
    </div>
  )
}
