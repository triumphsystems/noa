'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface ClinicalSummaryDetail {
  id: string
  patientName: string
  date: string
  type: string
  doctorName: string
  soapNote: {
    subjective: string
    objective: string
    assessment: string
    plan: string
  }
  patientSummary: string
  recommendations: string[]
  followUp: string
}

const mockSummary: ClinicalSummaryDetail = {
  id: '1',
  patientName: 'John Doe',
  date: 'March 20, 2026',
  type: 'Quarterly Review',
  doctorName: 'Dr. Sarah Smith',
  soapNote: {
    subjective:
      'Patient reports feeling well with stable blood pressure readings throughout the week. Compliant with current medication regimen. Takes medications every morning with breakfast. Denies any adverse effects or new symptoms. Has been maintaining regular exercise routine.',
    objective:
      'Blood pressure: 128/82 mmHg. Heart rate: 72 bpm. Weight: 185 lbs (stable from last visit). Recent lab work: Total cholesterol 185 mg/dL, LDL 108 mg/dL, HDL 52 mg/dL, Triglycerides 115 mg/dL. Physical exam unremarkable.',
    assessment:
      'Hypertension - well controlled on current antihypertensive therapy. Hyperlipidemia - adequately managed with statin therapy. Type 2 Diabetes - glucose control acceptable. Patient demonstrates good medication compliance and lifestyle modifications.',
    plan: 'Continue current medication regimen: Lisinopril 10mg daily, Atorvastatin 20mg daily, Metformin 500mg twice daily. Continue home blood pressure monitoring. Maintain diet and exercise routine. Schedule routine labs in 6 months. Follow-up appointment in 3 months.',
  },
  patientSummary:
    'Your recent visit showed that your blood pressure and blood sugar levels are well controlled with your current medications. Your blood work results are good and stable. Keep taking your medications as prescribed and continue with your exercise routine. We will see you again in 3 months.',
  recommendations: ['Continue medications as prescribed', 'Maintain exercise routine', 'Follow up in 3 months', 'Schedule labs in 6 months'],
  followUp: 'In-person appointment in 3 months',
}

export default function SummaryDetailPage({ params }: { params: { id: string } }) {
  const [summary] = useState<ClinicalSummaryDetail>(mockSummary)
  const [activeTab, setActiveTab] = useState<'clinical' | 'patient'>('clinical')

  const handleDownloadPDF = () => {
    // TODO: Generate and download PDF
    console.log('[v0] Downloading PDF summary')
  }

  const handleShareWithPatient = async () => {
    try {
      const response = await fetch(`/api/summaries/${summary.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientEmail: 'patient@example.com' }),
      })

      if (response.ok) {
        alert('Summary shared with patient successfully!')
      }
    } catch (error) {
      console.error('[v0] Error sharing summary:', error)
    }
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif mb-2">{summary.type}</h1>
          <p className="text-slate">Patient: {summary.patientName}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate">{summary.date}</p>
          <p className="text-lg font-semibold text-deep-ink">Provider: {summary.doctorName}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button onClick={handleDownloadPDF} className="rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90">
          Download PDF
        </Button>
        <Button
          onClick={handleShareWithPatient}
          variant="outline"
          className="rounded-full border-deep-ink text-deep-ink hover:bg-soft-meadow"
        >
          Share with Patient
        </Button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-3xl p-6 border border-deep-ink/10">
        <div className="flex gap-4 mb-6 border-b border-deep-ink/10">
          <button
            onClick={() => setActiveTab('clinical')}
            className={`pb-3 font-medium ${
              activeTab === 'clinical'
                ? 'text-deep-ink border-b-2 border-hi-yellow'
                : 'text-slate hover:text-deep-ink'
            }`}
          >
            Clinical Note
          </button>
          <button
            onClick={() => setActiveTab('patient')}
            className={`pb-3 font-medium ${
              activeTab === 'patient'
                ? 'text-deep-ink border-b-2 border-hi-yellow'
                : 'text-slate hover:text-deep-ink'
            }`}
          >
            Patient Summary
          </button>
        </div>

        {activeTab === 'clinical' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold font-serif text-deep-ink mb-3">Subjective</h3>
              <p className="text-slate leading-relaxed">{summary.soapNote.subjective}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold font-serif text-deep-ink mb-3">Objective</h3>
              <p className="text-slate leading-relaxed">{summary.soapNote.objective}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold font-serif text-deep-ink mb-3">Assessment</h3>
              <p className="text-slate leading-relaxed">{summary.soapNote.assessment}</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold font-serif text-deep-ink mb-3">Plan</h3>
              <p className="text-slate leading-relaxed">{summary.soapNote.plan}</p>
            </div>
          </div>
        )}

        {activeTab === 'patient' && (
          <div className="space-y-6">
            <div className="bg-soft-meadow/50 rounded-2xl p-6">
              <h3 className="text-lg font-semibold font-serif text-deep-ink mb-3">Visit Summary</h3>
              <p className="text-slate leading-relaxed">{summary.patientSummary}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold font-serif text-deep-ink mb-3">What to Do Next</h3>
              <ul className="space-y-2">
                {summary.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex gap-3 text-slate">
                    <span className="text-hi-yellow font-bold">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-hi-yellow/10 border border-hi-yellow/20 rounded-2xl p-4">
              <p className="text-sm font-medium text-deep-ink mb-1">Follow-up Appointment</p>
              <p className="text-slate">{summary.followUp}</p>
            </div>

            <div className="bg-soft-meadow/50 rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-deep-ink mb-3">Important Notes</h3>
              <ul className="space-y-2 text-sm text-slate">
                <li className="flex gap-2">
                  <span className="text-moss-green">•</span>
                  <span>Keep taking your medications exactly as prescribed</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-moss-green">•</span>
                  <span>Contact us if you have any questions or concerns</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-moss-green">•</span>
                  <span>Use the patient portal to message your healthcare provider</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
