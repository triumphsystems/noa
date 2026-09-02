'use client'

import * as React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Download, Printer, CheckCircle2, UserCheck, Calendar } from 'lucide-react'

interface PatientConsultationSummary {
  id: string
  date: string
  doctorName: string
  summary: string
  recommendations: string[]
  nextSteps: string
  downloadUrl?: string
}

const mockConsultation: PatientConsultationSummary = {
  id: '1',
  date: 'March 20, 2026',
  doctorName: 'Dr. Sarah Smith',
  summary: `During your visit on March 20th, Dr. Smith reviewed your recent health status. Your blood pressure readings have been stable at healthy levels, and your blood sugar control is good with your current medications. Your recent lab work shows positive results with improving cholesterol levels.

You discussed continuing your current exercise routine and dietary modifications. Dr. Smith noted your good compliance with medications and overall health management.`,
  recommendations: [
    'Continue taking all medications as prescribed - do not skip doses',
    'Maintain your current exercise routine of at least 3-4 times per week',
    'Follow the dietary recommendations discussed - low sodium, balanced nutrition',
    'Keep a log of your blood pressure readings at home',
    'Stay hydrated and get adequate sleep',
  ],
  nextSteps:
    'Schedule your next appointment for 3 months from now. Your routine labs are scheduled for 6 months. If you experience any concerning symptoms before your next visit, please contact our office.',
}

export default function PatientConsultationPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  // Support both Promise and synchronous params across Next.js versions
  const unwrappedParams = React.use(params instanceof Promise ? params : Promise.resolve(params))
  const [consultation] = React.useState<PatientConsultationSummary>(mockConsultation)

  const handleDownloadPDF = () => {
    alert('Generating PDF summary...')
  }

  const handlePrintPage = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-canvas text-deep-ink">
      {/* Navigation Header */}
      <nav className="border-b border-deep-ink/10 bg-soft-meadow sticky top-0 z-10">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/patient"
              className="text-slate hover:text-deep-ink p-1 -ml-1 rounded-full transition-colors flex items-center gap-1.5 text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Portal</span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-serif text-deep-ink">Noa</h1>
            <Badge variant="secondary" className="text-xs">Consultation Summary</Badge>
          </div>
        </div>
      </nav>

      <div className="p-8 max-w-4xl mx-auto space-y-6">
        {/* Top bar with metadata and actions */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold font-serif mb-2 text-deep-ink">Consultation Summary</h2>
            <div className="flex items-center gap-4 text-sm text-slate">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {consultation.date}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <UserCheck className="w-4 h-4" />
                Provider: {consultation.doctorName}
              </span>
            </div>
          </div>
          <div className="flex gap-2.5">
            <Button
              onClick={handleDownloadPDF}
              className="rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 gap-1.5 font-medium"
            >
              <Download className="w-4 h-4" />
              Download PDF
            </Button>
            <Button
              onClick={handlePrintPage}
              variant="outline"
              className="rounded-full border-deep-ink/20 text-deep-ink hover:bg-soft-meadow gap-1.5 font-medium"
            >
              <Printer className="w-4 h-4" />
              Print
            </Button>
          </div>
        </div>

        {/* Visit Summary Card */}
        <Card className="p-8 space-y-8">
          <div>
            <h3 className="text-xl font-bold font-serif text-deep-ink mb-3">Visit Summary</h3>
            <p className="text-slate leading-relaxed whitespace-pre-line text-sm">
              {consultation.summary}
            </p>
          </div>

          {/* Care Plan Recommendations */}
          <div className="border-t border-deep-ink/10 pt-6">
            <h3 className="text-xl font-bold font-serif text-deep-ink mb-4">Your Care Plan</h3>
            <div className="space-y-3">
              {consultation.recommendations.map((rec, idx) => (
                <div key={idx} className="flex gap-3.5 p-4 bg-soft-meadow/50 rounded-2xl border border-deep-ink/5 items-start">
                  <div className="w-6 h-6 rounded-full bg-hi-yellow flex items-center justify-center font-bold text-xs text-deep-ink shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <p className="text-sm text-deep-ink leading-relaxed">{rec}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Next Steps */}
          <div className="border-t border-deep-ink/10 pt-6">
            <h3 className="text-xl font-bold font-serif text-deep-ink mb-3">Next Steps</h3>
            <div className="p-4 bg-moss-green/10 rounded-2xl border border-moss-green/20 text-sm text-deep-ink leading-relaxed flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-moss-green shrink-0 mt-0.5" />
              <p>{consultation.nextSteps}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
