'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/ui/stat-card'
import { Bell, Calendar, FileText, HeartPulse, LogOut, ShieldCheck, User } from 'lucide-react'

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
    summary: 'Annual physical examination and routine wellness assessment.',
    status: 'scheduled',
  },
]

export default function PatientDashboardPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-5xl mx-auto">
        {/* Welcome Section */}
        <Card className="p-5 sm:p-8 bg-gradient-to-r from-soft-meadow via-white to-soft-meadow/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold font-serif mb-2 text-deep-ink">Welcome to Your Health Portal</h2>
              <p className="text-slate text-xs sm:text-sm max-w-xl">
                Access your consultation summaries, review your care plans, and keep track of your prescribed medications.
              </p>
            </div>
            <Link href="/intake" className="block sm:inline">
              <Button className="w-full sm:w-auto rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 font-medium shrink-0 text-xs sm:text-sm">
                Update Health Intake
              </Button>
            </Link>
          </div>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total Consultations"
            value="12"
            icon={<FileText className="h-5 w-5 text-slate" />}
          />
          <StatCard
            label="Upcoming Visits"
            value="1"
            icon={<Calendar className="h-5 w-5 text-slate" />}
          />
          <StatCard
            label="Health Records"
            value="15"
            icon={<HeartPulse className="h-5 w-5 text-slate" />}
          />
        </div>

        {/* Consultations */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl sm:text-2xl font-bold font-serif text-deep-ink">Your Consultations</h3>
          </div>

          <div className="space-y-3">
            {mockConsultations.map(consultation => (
              <Card
                key={consultation.id}
                className="hover:border-hi-yellow/60 transition-colors p-4 sm:p-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                      <h4 className="font-semibold font-serif text-deep-ink text-base sm:text-lg">
                        Consultation with {consultation.doctorName}
                      </h4>
                      <Badge variant={consultation.status === 'completed' ? 'success' : 'default'}>
                        {consultation.status === 'completed' ? 'Completed' : 'Scheduled'}
                      </Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-slate leading-relaxed">{consultation.summary}</p>
                    <div className="flex items-center gap-2 text-xs text-slate pt-1">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      <span>{consultation.date}</span>
                    </div>
                  </div>

                  {consultation.status === 'completed' && (
                    <div className="w-full sm:w-auto">
                      <Link href={`/dashboard/patient/consultations/${consultation.id}`} className="block sm:inline">
                        <Button className="w-full sm:w-auto rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 font-medium text-xs sm:text-sm">
                          View Summary
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Health Information */}
        <Card className="p-8">
          <CardHeader className="p-0 pb-6">
            <CardTitle>Your Health Information</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate mb-3">
                  Current Medications
                </p>
                <ul className="space-y-2.5">
                  {['Metformin 500mg BID', 'Lisinopril 10mg QD'].map((med, idx) => (
                    <li key={idx} className="text-sm text-deep-ink flex items-center gap-2.5">
                      <span className="w-2 h-2 bg-hi-yellow rounded-full shrink-0" />
                      <span>{med}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate mb-3">
                  Allergies
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Penicillin', 'Sulfa drugs'].map((allergy, idx) => (
                    <Badge key={idx} variant="danger">
                      {allergy}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Important Information */}
        <Card className="bg-soft-meadow border-deep-ink/10 p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="h-5 w-5 text-deep-ink" />
            <h3 className="text-lg font-semibold font-serif text-deep-ink">Patient Security & Privacy</h3>
          </div>
          <ul className="space-y-2 text-sm text-slate">
            <li className="flex gap-2">
              <span className="text-deep-ink">•</span>
              <span>All consultation transcripts and summaries are encrypted end-to-end.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-deep-ink">•</span>
              <span>You can download or print your consultation reports anytime.</span>
            </li>
            <li className="flex gap-2">
              <span className="text-deep-ink">•</span>
              <span>Health records are only shared with licensed clinicians you have authorized.</span>
            </li>
          </ul>
        </Card>
      </div>
  )
}
