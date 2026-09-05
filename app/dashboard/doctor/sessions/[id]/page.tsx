'use client'

import * as React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/ui/stat-card'
import { ArrowLeft, Clock, Download, Edit3, FileText, Mic, Save, User, X, Loader2, AlertCircle } from 'lucide-react'
import { useDoctorStore } from '@/lib/stores/doctor.store'
import type { Session, Patient, SoapNote } from '@/lib/db'

export default function SessionPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string }
}) {
  const unwrappedParams = React.use(params instanceof Promise ? params : Promise.resolve(params))
  const sessionId = unwrappedParams.id

  const doctor = useDoctorStore(state => state.doctor)
  const storeSessions = useDoctorStore(state => state.sessions)
  const storePatients = useDoctorStore(state => state.patients)

  const [session, setSession] = React.useState<Session | null>(null)
  const [patient, setPatient] = React.useState<Patient | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [activeTab, setActiveTab] = React.useState<'soap' | 'transcript'>('soap')
  const [editingNote, setEditingNote] = React.useState(false)
  const [soapNote, setSoapNote] = React.useState<SoapNote>({
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
    generatedAt: Date.now(),
  })

  React.useEffect(() => {
    async function loadSession() {
      setIsLoading(true)
      setError(null)
      try {
        let found = storeSessions.find(s => s.id === sessionId) || null
        if (!found) {
          const res = await fetch(`/api/sessions?sessionId=${encodeURIComponent(sessionId)}`)
          const data = await res.json()
          if (!res.ok) throw new Error(data.message || data.error || 'Failed to fetch session')
          found = data.session || null
        }

        if (!found) throw new Error('Session not found')
        setSession(found)

        if (found.soapNote) {
          setSoapNote(found.soapNote)
        } else {
          setSoapNote({
            subjective: found.transcript || '',
            objective: '',
            assessment: '',
            plan: '',
            generatedAt: Date.now(),
          })
        }

        // Fetch patient
        if (found.patientId) {
          let p = storePatients.find(item => item.id === found!.patientId) || null
          if (!p) {
            const pRes = await fetch(`/api/patients/${encodeURIComponent(found.patientId)}`)
            const pData = await pRes.json()
            if (pRes.ok && pData.patient) p = pData.patient
          }
          setPatient(p)
        }
      } catch (err: any) {
        setError(err.message || 'Error loading session')
      } finally {
        setIsLoading(false)
      }
    }

    if (sessionId) {
      void loadSession()
    }
  }, [sessionId, storeSessions, storePatients])

  const handleSaveSOAP = async () => {
    if (!session) return
    setIsSaving(true)
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          doctorId: session.doctorId,
          patientId: session.patientId,
          soapNote,
          transcript: session.transcript,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.message || 'Failed to save clinical note')
      setEditingNote(false)
      if (data.session) {
        setSession(data.session)
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate text-sm max-w-5xl mx-auto flex flex-col items-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-deep-ink/50" />
        <span>Loading session consultation...</span>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <Link
          href="/dashboard/doctor"
          className="text-xs font-semibold text-slate hover:text-deep-ink flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
        <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center gap-3 text-xs sm:text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error || 'Session could not be found.'}</span>
        </div>
      </div>
    )
  }

  const patientNameParts = patient ? [patient.firstName, patient.lastName].filter(Boolean) : []
  const patientName = patientNameParts.length > 0 ? patientNameParts.join(' ').trim() : ((patient as any)?.name || patient?.email || `Patient #${session.patientId.slice(-6)}`)
  const doctorName = doctor?.name ? `Dr. ${doctor.name}` : 'Attending Physician'
  const sessionDate = session.startedAt
    ? new Date(session.startedAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : 'Recent'

  // Calculate duration
  let durationStr = 'Completed'
  if (session.startedAt && session.endedAt) {
    const mins = Math.max(1, Math.round((session.endedAt - session.startedAt) / 60000))
    durationStr = `${mins} min${mins === 1 ? '' : 's'}`
  }

  // Split transcript if stored as text
  const transcriptLines = session.transcript
    ? session.transcript
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean)
    : []

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Navigation & Actions */}
      <div className="space-y-1">
        <Link
          href="/dashboard/doctor"
          className="text-xs font-semibold text-slate hover:text-deep-ink flex items-center gap-1.5 transition-colors mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-deep-ink">Session Consultation</h1>
            <p className="text-slate text-xs sm:text-sm">
              Session ID: {session.id} · {sessionDate}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="w-full sm:w-auto rounded-full border-deep-ink/20 text-deep-ink hover:bg-soft-meadow gap-1.5 text-xs sm:text-sm cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Print Note
          </Button>
        </div>
      </div>

      {/* Session Metadata KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Patient"
          value={patientName}
          icon={<User className="h-5 w-5 text-slate" />}
        />
        <StatCard
          label="Provider"
          value={doctorName}
          icon={<FileText className="h-5 w-5 text-slate" />}
        />
        <StatCard
          label="Duration"
          value={durationStr}
          icon={<Clock className="h-5 w-5 text-slate" />}
        />
      </div>

      {/* Main Tabs Container */}
      <Card className="p-4 sm:p-6">
        {/* Tab Controls */}
        <div className="flex gap-2 border-b border-deep-ink/10 pb-4 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('soap')}
            className={`px-4 sm:px-5 py-2 rounded-full text-xs font-semibold transition-colors flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'soap'
                ? 'bg-hi-yellow text-deep-ink shadow-2xs'
                : 'bg-soft-meadow text-deep-ink/80 hover:bg-soft-meadow/80'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>SOAP Clinical Note</span>
          </button>
          <button
            onClick={() => setActiveTab('transcript')}
            className={`px-4 sm:px-5 py-2 rounded-full text-xs font-semibold transition-colors flex items-center gap-2 shrink-0 cursor-pointer ${
              activeTab === 'transcript'
                ? 'bg-hi-yellow text-deep-ink shadow-2xs'
                : 'bg-soft-meadow text-deep-ink/80 hover:bg-soft-meadow/80'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Voice Transcript ({transcriptLines.length})</span>
          </button>
        </div>

        {/* SOAP Note Tab */}
        {activeTab === 'soap' && (
          <div className="space-y-6">
            {!editingNote ? (
              <>
                <div className="space-y-4">
                  <div className="bg-soft-meadow/50 rounded-2xl p-4 border border-deep-ink/5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate block mb-1">
                      Subjective
                    </span>
                    <p className="text-deep-ink text-sm leading-relaxed">
                      {soapNote.subjective || <span className="italic text-slate">None recorded</span>}
                    </p>
                  </div>

                  <div className="bg-soft-meadow/50 rounded-2xl p-4 border border-deep-ink/5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate block mb-1">
                      Objective
                    </span>
                    <p className="text-deep-ink text-sm leading-relaxed">
                      {soapNote.objective || <span className="italic text-slate">None recorded</span>}
                    </p>
                  </div>

                  <div className="bg-soft-meadow/50 rounded-2xl p-4 border border-deep-ink/5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate block mb-1">
                      Assessment
                    </span>
                    <p className="text-deep-ink text-sm leading-relaxed">
                      {soapNote.assessment || <span className="italic text-slate">None recorded</span>}
                    </p>
                  </div>

                  <div className="bg-soft-meadow/50 rounded-2xl p-4 border border-deep-ink/5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate block mb-1">
                      Plan
                    </span>
                    <p className="text-deep-ink text-sm leading-relaxed">
                      {soapNote.plan || <span className="italic text-slate">None recorded</span>}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-deep-ink/10">
                  <Button
                    onClick={() => setEditingNote(true)}
                    className="rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 gap-1.5 font-medium cursor-pointer shadow-2xs text-xs"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit Clinical Note
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate mb-1.5">
                    Subjective
                  </label>
                  <textarea
                    value={soapNote.subjective}
                    onChange={e => setSoapNote({ ...soapNote, subjective: e.target.value })}
                    className="w-full p-3 border border-deep-ink/20 rounded-2xl text-deep-ink focus:outline-none focus:ring-2 focus:ring-hi-yellow text-base sm:text-sm bg-transparent"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate mb-1.5">
                    Objective
                  </label>
                  <textarea
                    value={soapNote.objective}
                    onChange={e => setSoapNote({ ...soapNote, objective: e.target.value })}
                    className="w-full p-3 border border-deep-ink/20 rounded-2xl text-deep-ink focus:outline-none focus:ring-2 focus:ring-hi-yellow text-base sm:text-sm bg-transparent"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate mb-1.5">
                    Assessment
                  </label>
                  <textarea
                    value={soapNote.assessment}
                    onChange={e => setSoapNote({ ...soapNote, assessment: e.target.value })}
                    className="w-full p-3 border border-deep-ink/20 rounded-2xl text-deep-ink focus:outline-none focus:ring-2 focus:ring-hi-yellow text-base sm:text-sm bg-transparent"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate mb-1.5">
                    Plan
                  </label>
                  <textarea
                    value={soapNote.plan}
                    onChange={e => setSoapNote({ ...soapNote, plan: e.target.value })}
                    className="w-full p-3 border border-deep-ink/20 rounded-2xl text-deep-ink focus:outline-none focus:ring-2 focus:ring-hi-yellow text-base sm:text-sm bg-transparent"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-deep-ink/10">
                  <Button
                    onClick={handleSaveSOAP}
                    disabled={isSaving}
                    className="rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 gap-1.5 font-medium cursor-pointer shadow-2xs text-xs"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                  </Button>
                  <Button
                    onClick={() => setEditingNote(false)}
                    variant="outline"
                    className="rounded-full border-deep-ink/20 text-deep-ink hover:bg-soft-meadow gap-1.5 cursor-pointer text-xs"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Transcript Tab */}
        {activeTab === 'transcript' && (
          <div className="space-y-3">
            {transcriptLines.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate">
                No recorded transcript available for this consultation.
              </div>
            ) : (
              transcriptLines.map((line, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 bg-soft-meadow/40 rounded-2xl border border-deep-ink/5"
                >
                  <Badge variant="secondary" className="text-[10px] px-2.5 py-0.5 shrink-0">
                    Speaker
                  </Badge>
                  <div className="flex-1">
                    <p className="text-sm text-deep-ink leading-relaxed">{line}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
