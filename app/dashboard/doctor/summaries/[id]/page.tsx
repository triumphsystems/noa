'use client'

import * as React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, Download, FileText, Send, User, Sparkles } from 'lucide-react'

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
  recommendations: [
    'Continue medications as prescribed',
    'Maintain exercise routine',
    'Follow up in 3 months',
    'Schedule labs in 6 months',
  ],
  followUp: 'In-person appointment in 3 months',
}

export default function SummaryDetailPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string }
}) {
  const unwrappedParams = React.use(params instanceof Promise ? params : Promise.resolve(params))
  const [summary] = React.useState<ClinicalSummaryDetail>(mockSummary)
  const [activeTab, setActiveTab] = React.useState<'clinical' | 'patient'>('clinical')

  const handleDownloadPDF = () => {
    alert('Generating clinical summary PDF...')
  }

  const handleShareWithPatient = async () => {
    alert('Summary successfully shared with patient.')
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
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
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold font-serif text-deep-ink">{summary.type}</h1>
              <Badge variant="success">Finalized</Badge>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate mt-1">
              <span>Patient: {summary.patientName}</span>
              <span>•</span>
              <span>Provider: {summary.doctorName}</span>
              <span>•</span>
              <span>{summary.date}</span>
            </div>
          </div>

          <div className="flex gap-2.5">
            <Button
              onClick={handleDownloadPDF}
              variant="outline"
              className="rounded-full border-deep-ink/20 text-deep-ink hover:bg-soft-meadow gap-1.5 font-medium"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </Button>
            <Button
              onClick={handleShareWithPatient}
              className="rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 gap-1.5 font-medium"
            >
              <Send className="w-4 h-4" />
              Share with Patient
            </Button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <Card className="p-6">
        {/* Tab Controls */}
        <div className="flex gap-2 border-b border-deep-ink/10 pb-4 mb-6">
          <button
            onClick={() => setActiveTab('clinical')}
            className={`px-5 py-2 rounded-full text-xs font-semibold transition-colors flex items-center gap-2 ${
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
            className={`px-5 py-2 rounded-full text-xs font-semibold transition-colors flex items-center gap-2 ${
              activeTab === 'patient'
                ? 'bg-hi-yellow text-deep-ink shadow-2xs'
                : 'bg-soft-meadow text-deep-ink/80 hover:bg-soft-meadow/80'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Patient-Facing Summary</span>
          </button>
        </div>

        {/* Clinical Note Tab */}
        {activeTab === 'clinical' && (
          <div className="space-y-4">
            <div className="bg-soft-meadow/50 rounded-2xl p-4 border border-deep-ink/5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate block mb-1">
                Subjective
              </span>
              <p className="text-deep-ink text-sm leading-relaxed">{summary.soapNote.subjective}</p>
            </div>

            <div className="bg-soft-meadow/50 rounded-2xl p-4 border border-deep-ink/5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate block mb-1">
                Objective
              </span>
              <p className="text-deep-ink text-sm leading-relaxed">{summary.soapNote.objective}</p>
            </div>

            <div className="bg-soft-meadow/50 rounded-2xl p-4 border border-deep-ink/5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate block mb-1">
                Assessment
              </span>
              <p className="text-deep-ink text-sm leading-relaxed">{summary.soapNote.assessment}</p>
            </div>

            <div className="bg-soft-meadow/50 rounded-2xl p-4 border border-deep-ink/5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate block mb-1">
                Plan
              </span>
              <p className="text-deep-ink text-sm leading-relaxed">{summary.soapNote.plan}</p>
            </div>
          </div>
        )}

        {/* Patient Summary Tab */}
        {activeTab === 'patient' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold font-serif text-deep-ink mb-2">Patient-Friendly Overview</h3>
              <p className="text-slate text-sm leading-relaxed bg-soft-meadow/50 p-4 rounded-2xl border border-deep-ink/5">
                {summary.patientSummary}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-bold font-serif text-deep-ink mb-3">Key Recommendations</h3>
              <ul className="space-y-2">
                {summary.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-sm text-deep-ink flex items-center gap-2">
                    <span className="w-2 h-2 bg-hi-yellow rounded-full shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-deep-ink/10 pt-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate block mb-1">
                Follow-Up Schedule
              </span>
              <p className="text-sm font-medium text-deep-ink">{summary.followUp}</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
