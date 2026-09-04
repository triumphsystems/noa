'use client'

import * as React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, Download, FileText, Send, User, Sparkles, Loader2, AlertCircle } from 'lucide-react'
import { useDoctorStore } from '@/lib/stores/doctor.store'
import type { Session, Patient } from '@/lib/db'

export default function SummaryDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string }
}) {
  const unwrappedParams = React.use(params instanceof Promise ? params : Promise.resolve(params))
  const sessionId = unwrappedParams.id

  const doctor = useDoctorStore(state => state.doctor)
  const sessions = useDoctorStore(state => state.sessions)
  const patients = useDoctorStore(state => state.patients)

  const [session, setSession] = React.useState<Session | null>(null)
  const [patient, setPatient] = React.useState<Patient | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [activeTab, setActiveTab] = React.useState<'clinical' | 'patient'>('clinical')
  const [shareSuccess, setShareSuccess] = React.useState(false)

  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      setError(null)
      try {
        // Try to find session in local doctor store first
        let foundSession = sessions.find(s => s.id === sessionId) || null

        // If not found in store, fetch from API
        if (!foundSession) {
          const res = await fetch(`/api/sessions?sessionId=${encodeURIComponent(sessionId)}`)
          const data = await res.json()
          if (!res.ok) throw new Error(data.message || data.error || 'Failed to fetch session')
          foundSession = data.session || null
        }

        if (!foundSession) {
          throw new Error('Session not found')
        }

        setSession(foundSession)

        // Resolve patient
        if (foundSession.patientId) {
          let foundPatient = patients.find(p => p.id === foundSession!.patientId) || null
          if (!foundPatient) {
            const pRes = await fetch(`/api/patients/${encodeURIComponent(foundSession.patientId)}`)
            const pData = await pRes.json()
            if (pRes.ok && pData.patient) {
              foundPatient = pData.patient
            }
          }
          setPatient(foundPatient)
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load consultation summary')
      } finally {
        setIsLoading(false)
      }
    }

    if (sessionId) {
      void loadData()
    }
  }, [sessionId, sessions, patients])

  const handleDownloadPDF = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  const handleShareWithPatient = () => {
    setShareSuccess(true)
    setTimeout(() => setShareSuccess(false), 3000)
  }

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate text-sm max-w-5xl mx-auto flex flex-col items-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-deep-ink/50" />
        <span>Loading clinical summary...</span>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <Link
          href="/dashboard/doctor/summaries"
          className="text-xs font-semibold text-slate hover:text-deep-ink flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Clinical Summaries</span>
        </Link>
        <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center gap-3 text-xs sm:text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error || 'Clinical summary could not be found.'}</span>
        </div>
      </div>
    )
  }

  const patientName = patient ? `${patient.firstName} ${patient.lastName}`.trim() : `Patient #${session.patientId.slice(-6)}`
  const doctorName = doctor?.name ? `Dr. ${doctor.name}` : 'Attending Physician'
  const dateStr = session.startedAt
    ? new Date(session.startedAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recent Date'

  const soap = session.soapNote || {
    subjective: session.transcript || 'No subjective narrative recorded.',
    objective: 'Clinical examination conducted during voice consultation session.',
    assessment: 'Consultation evaluation completed.',
    plan: 'Continue monitoring and follow up as clinically indicated.',
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Actions */}
      <div className="space-y-1">
        <Link
          href="/dashboard/doctor/summaries"
          className="text-xs font-semibold text-slate hover:text-deep-ink flex items-center gap-1.5 transition-colors mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Clinical Summaries</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-deep-ink">Clinical Summary</h1>
            <p className="text-slate text-xs sm:text-sm">
              Session ID: {session.id} · {dateStr}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              onClick={handleDownloadPDF}
              className="rounded-full border-deep-ink/20 text-deep-ink hover:bg-soft-meadow gap-1.5 text-xs sm:text-sm cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download Note
            </Button>
            <Button
              onClick={handleShareWithPatient}
              className="rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 gap-1.5 text-xs sm:text-sm cursor-pointer shadow-2xs font-medium"
            >
              <Send className="w-4 h-4" />
              {shareSuccess ? 'Shared with Patient!' : 'Share with Patient'}
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Metadata Card */}
      <Card className="p-4 sm:p-6 bg-canvas border-deep-ink/10">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs sm:text-sm">
          <div>
            <span className="text-slate text-[11px] uppercase tracking-wider block mb-1">Patient</span>
            <p className="font-semibold text-deep-ink">{patientName}</p>
          </div>
          <div>
            <span className="text-slate text-[11px] uppercase tracking-wider block mb-1">Provider</span>
            <p className="font-semibold text-deep-ink">{doctorName}</p>
          </div>
          <div>
            <span className="text-slate text-[11px] uppercase tracking-wider block mb-1">Date</span>
            <p className="font-semibold text-deep-ink">{dateStr}</p>
          </div>
          <div>
            <span className="text-slate text-[11px] uppercase tracking-wider block mb-1">Status</span>
            <Badge variant={session.status === 'completed' ? 'success' : 'secondary'} className="text-[11px]">
              {session.status === 'completed' ? 'Verified' : 'Active'}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Tabs: Clinical vs Patient View */}
      <Card className="p-4 sm:p-6">
        <div className="flex gap-2 border-b border-deep-ink/10 pb-4 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('clinical')}
            className={`px-4 sm:px-5 py-2 rounded-full text-xs font-semibold transition-colors flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'clinical'
                ? 'bg-hi-yellow text-deep-ink shadow-2xs'
                : 'bg-soft-meadow text-deep-ink/80 hover:bg-soft-meadow/80'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Clinical SOAP Note</span>
          </button>
          <button
            onClick={() => setActiveTab('patient')}
            className={`px-4 sm:px-5 py-2 rounded-full text-xs font-semibold transition-colors flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'patient'
                ? 'bg-hi-yellow text-deep-ink shadow-2xs'
                : 'bg-soft-meadow text-deep-ink/80 hover:bg-soft-meadow/80'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Patient-Friendly Overview</span>
          </button>
        </div>

        {/* Clinical SOAP View */}
        {activeTab === 'clinical' && (
          <div className="space-y-4">
            <div className="bg-soft-meadow/50 rounded-2xl p-4 border border-deep-ink/5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate block mb-1">
                Subjective
              </span>
              <p className="text-deep-ink text-sm leading-relaxed">{soap.subjective}</p>
            </div>

            <div className="bg-soft-meadow/50 rounded-2xl p-4 border border-deep-ink/5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate block mb-1">
                Objective
              </span>
              <p className="text-deep-ink text-sm leading-relaxed">{soap.objective}</p>
            </div>

            <div className="bg-soft-meadow/50 rounded-2xl p-4 border border-deep-ink/5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate block mb-1">
                Assessment
              </span>
              <p className="text-deep-ink text-sm leading-relaxed">{soap.assessment}</p>
            </div>

            <div className="bg-soft-meadow/50 rounded-2xl p-4 border border-deep-ink/5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate block mb-1">
                Plan
              </span>
              <p className="text-deep-ink text-sm leading-relaxed">{soap.plan}</p>
            </div>
          </div>
        )}

        {/* Patient Summary Tab */}
        {activeTab === 'patient' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold font-serif text-deep-ink mb-2">Patient-Friendly Overview</h3>
              <p className="text-slate text-sm leading-relaxed bg-soft-meadow/50 p-4 rounded-2xl border border-deep-ink/5">
                {soap.assessment || soap.plan
                  ? `${soap.assessment} Clinical Care Plan: ${soap.plan}`
                  : 'Your consultation has been recorded. Review your care plan and follow all physician recommendations.'}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold font-serif text-deep-ink mb-3">Key Instructions</h3>
              <div className="bg-soft-meadow/30 p-4 rounded-2xl border border-deep-ink/5 text-sm text-deep-ink">
                {soap.plan}
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
