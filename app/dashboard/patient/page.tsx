'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Consultation {
  id: string
  date: string
  doctorName: string
  summary: string
  status: 'completed' | 'scheduled'
}

const mockConsultations: Consultation[] = [
  {
    id: '1',
    date: 'March 20, 2026',
    doctorName: 'Dr. Sarah Smith',
    summary: 'Follow-up consultation for blood pressure management. Blood pressure readings stable at 128/82.',
    status: 'completed',
  },
  {
    id: '2',
    date: 'March 25, 2026',
    doctorName: 'Dr. Michael Johnson',
    summary: 'Annual physical examination',
    status: 'scheduled',
  },
]

export default function PatientDashboard() {
  return (
    <div className="min-h-screen bg-canvas text-deep-ink">
      {/* Navigation */}
      <nav className="border-b border-deep-ink/20 bg-soft-meadow/50">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold font-serif">Noa Patient Portal</h1>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-soft-meadow rounded-full">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <div className="w-10 h-10 rounded-full bg-hi-yellow flex items-center justify-center font-semibold text-deep-ink">
              P
            </div>
            <Link href="/auth/logout">
              <button className="text-sm text-slate hover:text-deep-ink">Log Out</button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="p-8 space-y-8 max-w-5xl mx-auto">
        {/* Welcome Section */}
        <div className="bg-white rounded-3xl p-8 border border-deep-ink/10">
          <h2 className="text-3xl font-bold font-serif mb-2">Welcome to Your Health Portal</h2>
          <p className="text-slate">Access your consultations, view summaries, and manage your health information.</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Total Consultations', value: '12' },
            { label: 'Upcoming Appointments', value: '1' },
            { label: 'Documents', value: '15' },
          ].map((stat, idx) => (
            <div key={idx} className="bg-soft-meadow rounded-3xl p-6 border border-deep-ink/10">
              <p className="text-slate text-sm font-medium mb-2">{stat.label}</p>
              <p className="text-3xl font-bold font-serif text-deep-ink">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Consultations */}
        <div className="space-y-4">
          <h3 className="text-2xl font-bold font-serif">Your Consultations</h3>

          <div className="space-y-3">
            {mockConsultations.map(consultation => (
              <div
                key={consultation.id}
                className="bg-white rounded-3xl p-6 border border-deep-ink/10 hover:border-hi-yellow/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold font-serif text-deep-ink">with {consultation.doctorName}</h4>
                      <span
                        className={`text-xs font-medium px-3 py-1 rounded-full ${
                          consultation.status === 'completed'
                            ? 'bg-moss-green/20 text-deep-ink'
                            : 'bg-hi-yellow/20 text-deep-ink'
                        }`}
                      >
                        {consultation.status === 'completed' ? 'Completed' : 'Scheduled'}
                      </span>
                    </div>
                    <p className="text-sm text-slate mb-2">{consultation.summary}</p>
                    <p className="text-xs text-slate">{consultation.date}</p>
                  </div>
                  {consultation.status === 'completed' && (
                    <Link href={`/patient-dashboard/consultations/${consultation.id}`}>
                      <Button className="rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90">
                        View Summary
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Health Information */}
        <div className="bg-white rounded-3xl p-8 border border-deep-ink/10">
          <h3 className="text-xl font-semibold font-serif mb-6">Your Health Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-slate mb-3">Current Medications</p>
              <ul className="space-y-2">
                {['Metformin 500mg BID', 'Lisinopril 10mg QD'].map((med, idx) => (
                  <li key={idx} className="text-sm text-deep-ink flex items-center gap-2">
                    <span className="w-2 h-2 bg-hi-yellow rounded-full" />
                    {med}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-sm text-slate mb-3">Allergies</p>
              <div className="flex flex-wrap gap-2">
                {['Penicillin', 'Sulfa drugs'].map((allergy, idx) => (
                  <span key={idx} className="bg-red-100 text-red-800 text-xs px-3 py-1 rounded-full">
                    {allergy}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Important Information */}
        <div className="bg-soft-meadow rounded-3xl p-8 border border-deep-ink/10">
          <h3 className="text-lg font-semibold font-serif mb-4">Important Information</h3>
          <ul className="space-y-3 text-sm text-slate">
            <li className="flex gap-3">
              <span className="text-hi-yellow">•</span>
              <span>Your consultation summaries are secure and encrypted</span>
            </li>
            <li className="flex gap-3">
              <span className="text-hi-yellow">•</span>
              <span>You can download your reports anytime from the documents section</span>
            </li>
            <li className="flex gap-3">
              <span className="text-hi-yellow">•</span>
              <span>Share access to your records with trusted family members</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
