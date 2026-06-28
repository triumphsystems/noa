'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

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

export default function SessionPage({ params }: { params: { id: string } }) {
  const [session] = useState<SessionDetail>(mockSession)
  const [activeTab, setActiveTab] = useState<'transcript' | 'soap'>('soap')
  const [editingNote, setEditingNote] = useState(false)
  const [soapNote, setSoapNote] = useState(session.soapNote)

  const handleSaveSOAP = () => {
    setEditingNote(false)
    // TODO: Save to DynamoDB
    console.log('[v0] Saving SOAP note:', soapNote)
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif mb-2">Session Details</h1>
          <p className="text-slate">Consultation with {session.patientName}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate">{session.date}</p>
          <p className="text-lg font-semibold text-deep-ink">{session.duration}</p>
        </div>
      </div>

      {/* Session Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-soft-meadow rounded-3xl p-6 border border-deep-ink/10">
          <p className="text-slate text-sm mb-2">Patient</p>
          <p className="font-semibold text-deep-ink">{session.patientName}</p>
        </div>
        <div className="bg-soft-meadow rounded-3xl p-6 border border-deep-ink/10">
          <p className="text-slate text-sm mb-2">Provider</p>
          <p className="font-semibold text-deep-ink">{session.doctor}</p>
        </div>
        <div className="bg-soft-meadow rounded-3xl p-6 border border-deep-ink/10">
          <p className="text-slate text-sm mb-2">Duration</p>
          <p className="font-semibold text-deep-ink">{session.duration}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-3xl p-6 border border-deep-ink/10">
        <div className="flex gap-4 mb-6 border-b border-deep-ink/10">
          <button
            onClick={() => setActiveTab('soap')}
            className={`pb-3 font-medium ${
              activeTab === 'soap'
                ? 'text-deep-ink border-b-2 border-hi-yellow'
                : 'text-slate hover:text-deep-ink'
            }`}
          >
            SOAP Note
          </button>
          <button
            onClick={() => setActiveTab('transcript')}
            className={`pb-3 font-medium ${
              activeTab === 'transcript'
                ? 'text-deep-ink border-b-2 border-hi-yellow'
                : 'text-slate hover:text-deep-ink'
            }`}
          >
            Transcript
          </button>
        </div>

        {activeTab === 'soap' && (
          <div className="space-y-6">
            {!editingNote ? (
              <>
                <div>
                  <h3 className="text-lg font-semibold font-serif text-deep-ink mb-3">Subjective</h3>
                  <p className="text-slate leading-relaxed">{soapNote.subjective}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold font-serif text-deep-ink mb-3">Objective</h3>
                  <p className="text-slate leading-relaxed">{soapNote.objective}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold font-serif text-deep-ink mb-3">Assessment</h3>
                  <p className="text-slate leading-relaxed">{soapNote.assessment}</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold font-serif text-deep-ink mb-3">Plan</h3>
                  <p className="text-slate leading-relaxed">{soapNote.plan}</p>
                </div>

                <div className="flex gap-3 pt-6 border-t border-deep-ink/10">
                  <Button
                    onClick={() => setEditingNote(true)}
                    className="rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90"
                  >
                    Edit Note
                  </Button>
                  <Button variant="outline" className="rounded-full border-deep-ink text-deep-ink hover:bg-soft-meadow">
                    Download PDF
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-deep-ink mb-2">Subjective</label>
                  <textarea
                    value={soapNote.subjective}
                    onChange={(e) => setSoapNote({ ...soapNote, subjective: e.target.value })}
                    className="w-full p-3 border border-deep-ink/20 rounded-2xl text-deep-ink focus:outline-none focus:ring-2 focus:ring-hi-yellow"
                    rows={4}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-deep-ink mb-2">Objective</label>
                  <textarea
                    value={soapNote.objective}
                    onChange={(e) => setSoapNote({ ...soapNote, objective: e.target.value })}
                    className="w-full p-3 border border-deep-ink/20 rounded-2xl text-deep-ink focus:outline-none focus:ring-2 focus:ring-hi-yellow"
                    rows={4}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-deep-ink mb-2">Assessment</label>
                  <textarea
                    value={soapNote.assessment}
                    onChange={(e) => setSoapNote({ ...soapNote, assessment: e.target.value })}
                    className="w-full p-3 border border-deep-ink/20 rounded-2xl text-deep-ink focus:outline-none focus:ring-2 focus:ring-hi-yellow"
                    rows={4}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-deep-ink mb-2">Plan</label>
                  <textarea
                    value={soapNote.plan}
                    onChange={(e) => setSoapNote({ ...soapNote, plan: e.target.value })}
                    className="w-full p-3 border border-deep-ink/20 rounded-2xl text-deep-ink focus:outline-none focus:ring-2 focus:ring-hi-yellow"
                    rows={4}
                  />
                </div>

                <div className="flex gap-3 pt-6 border-t border-deep-ink/10">
                  <Button
                    onClick={handleSaveSOAP}
                    className="rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90"
                  >
                    Save Changes
                  </Button>
                  <Button
                    onClick={() => setEditingNote(false)}
                    variant="outline"
                    className="rounded-full border-deep-ink text-deep-ink hover:bg-soft-meadow"
                  >
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'transcript' && (
          <div className="space-y-4">
            {session.transcript.map((line, idx) => (
              <div key={idx} className="flex gap-4 pb-4 border-b border-deep-ink/10 last:border-b-0">
                <div className="flex-shrink-0">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      line.speaker === 'Dr. Smith'
                        ? 'bg-hi-yellow text-deep-ink'
                        : 'bg-moss-green/20 text-deep-ink'
                    }`}
                  >
                    {line.speaker}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-slate mb-1">{line.text}</p>
                  <p className="text-xs text-slate">{line.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
