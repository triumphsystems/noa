'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

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

export default function PatientConsultationPage({ params }: { params: { id: string } }) {
  const [consultation] = useState<PatientConsultationSummary>(mockConsultation)

  const handleDownloadPDF = () => {
    console.log('[v0] Downloading consultation PDF')
  }

  const handlePrintPage = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-canvas text-deep-ink">
      {/* Navigation */}
      <nav className="border-b border-deep-ink/20 bg-soft-meadow/50">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold font-serif">Noa Patient Portal</h1>
          <div className="flex items-center gap-4">
            <a href="/patient-dashboard" className="text-sm text-slate hover:text-deep-ink">
              Back to Dashboard
            </a>
          </div>
        </div>
      </nav>

      <div className="p-8 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold font-serif mb-2">Consultation Summary</h2>
            <div className="space-y-1 text-slate">
              <p>Date: {consultation.date}</p>
              <p>Provider: {consultation.doctorName}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleDownloadPDF} className="rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90">
              Download PDF
            </Button>
            <Button
              onClick={handlePrintPage}
              variant="outline"
              className="rounded-full border-deep-ink text-deep-ink hover:bg-soft-meadow"
            >
              Print
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-3xl p-8 border border-deep-ink/10 space-y-8">
          {/* Summary Section */}
          <div>
            <h3 className="text-2xl font-bold font-serif text-deep-ink mb-4">Visit Summary</h3>
            <p className="text-slate leading-relaxed whitespace-pre-line">{consultation.summary}</p>
          </div>

          {/* Recommendations */}
          <div>
            <h3 className="text-2xl font-bold font-serif text-deep-ink mb-4">Your Care Plan</h3>
            <div className="space-y-3">
              {consultation.recommendations.map((rec, idx) => (
                <div key={idx} className="flex gap-4 p-4 bg-soft-meadow/50 rounded-2xl">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-hi-yellow text-deep-ink font-semibold">
                      {idx + 1}
                    </div>
                  </div>
                  <p className="text-slate leading-relaxed">{rec}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-hi-yellow/10 border-2 border-hi-yellow/20 rounded-2xl p-6">
            <h3 className="text-lg font-semibold font-serif text-deep-ink mb-3">Next Steps</h3>
            <p className="text-slate leading-relaxed">{consultation.nextSteps}</p>
          </div>

          {/* Important Information */}
          <div className="bg-moss-green/10 border border-moss-green/20 rounded-2xl p-6">
            <h3 className="font-semibold text-deep-ink mb-3">Important Information</h3>
            <ul className="space-y-2 text-sm text-slate">
              <li className="flex gap-3">
                <span className="text-moss-green">•</span>
                <span>This summary is for your personal records and reference</span>
              </li>
              <li className="flex gap-3">
                <span className="text-moss-green">•</span>
                <span>Please keep this document safe and bring it to your next appointment</span>
              </li>
              <li className="flex gap-3">
                <span className="text-moss-green">•</span>
                <span>Contact your provider if you have questions or concerns</span>
              </li>
              <li className="flex gap-3">
                <span className="text-moss-green">•</span>
                <span>In case of emergency, call 911 or go to the nearest emergency room</span>
              </li>
            </ul>
          </div>

          {/* Message Provider */}
          <div className="border-t border-deep-ink/10 pt-6">
            <h3 className="font-semibold text-deep-ink mb-3">Have Questions?</h3>
            <p className="text-slate mb-4">
              Use the secure messaging feature in your patient portal to contact your healthcare provider. You should expect a response within 24 business hours.
            </p>
            <Button className="rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90">
              Message Your Provider
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
