'use client'

import * as React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/ui/stat-card'
import { ArrowLeft, Clock, Download, Edit3, FileText, Mic, Save, User, X } from 'lucide-react'

interface SessionDetail {
  id: string
  patientName: string
  date: string
  duration: string
  doctor: string
  transcript: Array<{
    speaker: string
    text: string
    timestamp: string
  }>
  soapNote: {
    subjective: string
    objective: string
    assessment: string
    plan: string
  }
}

const mockSession: SessionDetail = {
  id: '1',
  patientName: 'John Doe',
  date: 'March 20, 2026 at 2:00 PM',
  duration: '25 minutes',
  doctor: 'Dr. Sarah Smith',
  transcript: [
    {
      speaker: 'Dr. Smith',
      text: 'Good afternoon John. How are you feeling today?',
      timestamp: '00:00',
    },
    {
      speaker: 'Patient',
      text: 'I am doing well. My blood pressure has been stable this week.',
      timestamp: '00:05',
    },
    {
      speaker: 'Dr. Smith',
      text: 'That is great to hear. Have you been taking your medications as prescribed?',
      timestamp: '00:12',
    },
    {
      speaker: 'Patient',
      text: 'Yes, I have been taking them every morning with breakfast.',
      timestamp: '00:18',
    },
    {
      speaker: 'Dr. Smith',
      text: 'Excellent. I want to review your recent blood work results.',
      timestamp: '00:25',
    },
  ],
  soapNote: {
    subjective:
      'Patient reports feeling well with stable blood pressure readings throughout the week. Compliant with current medication regimen. Takes medications every morning with breakfast. Denies any adverse effects or new symptoms.',
    objective:
      'Blood pressure: 128/82 mmHg. Heart rate: 72 bpm. Weight: 185 lbs (stable from last visit). Recent lab work shows: Total cholesterol 185 mg/dL, LDL 108 mg/dL, HDL 52 mg/dL, Triglycerides 115 mg/dL.',
    assessment:
      'Hypertension - well controlled on current antihypertensive therapy. Hyperlipidemia - adequately managed with statin therapy. Type 2 Diabetes - glucose control acceptable. Patient demonstrates good medication compliance.',
    plan: 'Continue current medication regimen: Lisinopril 10mg daily, Atorvastatin 20mg daily, Metformin 500mg twice daily. Schedule follow-up appointment in 3 months. Patient instructed to continue home blood pressure monitoring. Discussed lifestyle modifications including diet and exercise.',
  },
}

export default function SessionPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string }
}) {
  const unwrappedParams = React.use(params instanceof Promise ? params : Promise.resolve(params))
  const [session] = React.useState<SessionDetail>(mockSession)
  const [activeTab, setActiveTab] = React.useState<'soap' | 'transcript'>('soap')
  const [editingNote, setEditingNote] = React.useState(false)
  const [soapNote, setSoapNote] = React.useState(session.soapNote)

  const handleSaveSOAP = () => {
    setEditingNote(false)
    alert('SOAP note changes saved successfully.')
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
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
            <h1 className="text-3xl font-bold font-serif text-deep-ink">Session Consultation</h1>
            <p className="text-slate text-sm">
              Session ID: {unwrappedParams.id || session.id} · {session.date}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => alert('Generating consultation PDF...')}
            className="rounded-full border-deep-ink/20 text-deep-ink hover:bg-soft-meadow gap-1.5"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Session Metadata KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Patient"
          value={session.patientName}
          icon={<User className="h-5 w-5 text-slate" />}
        />
        <StatCard
          label="Provider"
          value={session.doctor}
          icon={<FileText className="h-5 w-5 text-slate" />}
        />
        <StatCard
          label="Session Duration"
          value={session.duration}
          icon={<Clock className="h-5 w-5 text-slate" />}
        />
      </div>

      {/* Main Tabs Container */}
      <Card className="p-6">
        {/* Tab Controls */}
        <div className="flex gap-2 border-b border-deep-ink/10 pb-4 mb-6">
          <button
            onClick={() => setActiveTab('soap')}
            className={`px-5 py-2 rounded-full text-xs font-semibold transition-colors flex items-center gap-2 ${
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
            className={`px-5 py-2 rounded-full text-xs font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'transcript'
                ? 'bg-hi-yellow text-deep-ink shadow-2xs'
                : 'bg-soft-meadow text-deep-ink/80 hover:bg-soft-meadow/80'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Voice Transcript ({session.transcript.length})</span>
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
                    <p className="text-deep-ink text-sm leading-relaxed">{soapNote.subjective}</p>
                  </div>

                  <div className="bg-soft-meadow/50 rounded-2xl p-4 border border-deep-ink/5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate block mb-1">
                      Objective
                    </span>
                    <p className="text-deep-ink text-sm leading-relaxed">{soapNote.objective}</p>
                  </div>

                  <div className="bg-soft-meadow/50 rounded-2xl p-4 border border-deep-ink/5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate block mb-1">
                      Assessment
                    </span>
                    <p className="text-deep-ink text-sm leading-relaxed">{soapNote.assessment}</p>
                  </div>

                  <div className="bg-soft-meadow/50 rounded-2xl p-4 border border-deep-ink/5">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate block mb-1">
                      Plan
                    </span>
                    <p className="text-deep-ink text-sm leading-relaxed">{soapNote.plan}</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-deep-ink/10">
                  <Button
                    onClick={() => setEditingNote(true)}
                    className="rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 gap-1.5 font-medium"
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
                    className="w-full p-3 border border-deep-ink/20 rounded-2xl text-deep-ink focus:outline-none focus:ring-2 focus:ring-hi-yellow text-sm bg-transparent"
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
                    className="w-full p-3 border border-deep-ink/20 rounded-2xl text-deep-ink focus:outline-none focus:ring-2 focus:ring-hi-yellow text-sm bg-transparent"
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
                    className="w-full p-3 border border-deep-ink/20 rounded-2xl text-deep-ink focus:outline-none focus:ring-2 focus:ring-hi-yellow text-sm bg-transparent"
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
                    className="w-full p-3 border border-deep-ink/20 rounded-2xl text-deep-ink focus:outline-none focus:ring-2 focus:ring-hi-yellow text-sm bg-transparent"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-deep-ink/10">
                  <Button
                    onClick={handleSaveSOAP}
                    className="rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 gap-1.5 font-medium"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </Button>
                  <Button
                    onClick={() => setEditingNote(false)}
                    variant="outline"
                    className="rounded-full border-deep-ink/20 text-deep-ink hover:bg-soft-meadow gap-1.5"
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
            {session.transcript.map((line, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 bg-soft-meadow/40 rounded-2xl border border-deep-ink/5"
              >
                <Badge
                  variant={line.speaker.toLowerCase().includes('dr') ? 'default' : 'success'}
                  className="text-[10px] px-2.5 py-0.5 shrink-0"
                >
                  {line.speaker}
                </Badge>
                <div className="flex-1">
                  <p className="text-sm text-deep-ink leading-relaxed">{line.text}</p>
                  <span className="text-[11px] text-slate font-mono mt-0.5 block">
                    {line.timestamp}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
