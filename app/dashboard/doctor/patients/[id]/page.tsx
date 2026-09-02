'use client'

import * as React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, FileText, Mail, Mic, Phone, Plus, User } from 'lucide-react'

interface PatientProfile {
  id: string
  name: string
  email: string
  phone: string
  dateOfBirth: string
  age: number
  gender: string
  address: string
  emergencyContact: string
  medicalHistory: string[]
  allergies: string[]
  currentMedications: string[]
  notes: string
}

const mockPatientProfile: PatientProfile = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '(555) 123-4567',
  dateOfBirth: '1965-03-15',
  age: 59,
  gender: 'Male',
  address: '123 Main St, Springfield, IL 62701',
  emergencyContact: 'Jane Doe (555) 123-4568',
  medicalHistory: ['Hypertension', 'Type 2 Diabetes', 'Hyperlipidemia'],
  allergies: ['Penicillin', 'Sulfa drugs'],
  currentMedications: ['Metformin 500mg BID', 'Lisinopril 10mg QD', 'Atorvastatin 20mg QD'],
  notes: 'Patient is compliant with medications. Regular exercise routine. Non-smoker.',
}

const mockSessions = [
  {
    id: '1',
    date: 'March 20, 2026',
    summary: 'Follow-up for blood pressure management',
    provider: 'Dr. Smith',
  },
  {
    id: '2',
    date: 'March 13, 2026',
    summary: 'Quarterly diabetes check-in',
    provider: 'Dr. Smith',
  },
  {
    id: '3',
    date: 'February 28, 2026',
    summary: 'Prescription refill and vital signs',
    provider: 'Dr. Johnson',
  },
]

export default function PatientProfilePage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string }
}) {
  const unwrappedParams = React.use(params instanceof Promise ? params : Promise.resolve(params))
  const [patient] = React.useState<PatientProfile>(mockPatientProfile)
  const [sessions] = React.useState(mockSessions)

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Back Link & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/dashboard/doctor/patients"
            className="text-xs font-semibold text-slate hover:text-deep-ink flex items-center gap-1.5 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Patients Registry</span>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold font-serif text-deep-ink">{patient.name}</h1>
            <Badge variant="secondary" className="text-xs">
              ID: {unwrappedParams.id || patient.id}
            </Badge>
          </div>
        </div>

        <Link href={`/dashboard/doctor/sessions/new?patientId=${unwrappedParams.id || patient.id}`}>
          <Button className="rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 gap-2 font-medium">
            <Mic className="h-4 w-4" />
            Start Voice Session
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Content (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Demographics Card */}
          <Card className="p-6">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-slate" />
                Demographics & Personal Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate mb-1">Age</p>
                  <p className="font-semibold text-deep-ink">{patient.age} years</p>
                </div>
                <div>
                  <p className="text-xs text-slate mb-1">Gender</p>
                  <p className="font-semibold text-deep-ink">{patient.gender}</p>
                </div>
                <div>
                  <p className="text-xs text-slate mb-1">Date of Birth</p>
                  <p className="font-semibold text-deep-ink">{patient.dateOfBirth}</p>
                </div>
                <div>
                  <p className="text-xs text-slate mb-1">Emergency Contact</p>
                  <p className="font-semibold text-deep-ink truncate">{patient.emergencyContact}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-deep-ink/10 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-slate">
                  <Mail className="w-4 h-4 text-slate shrink-0" />
                  <span className="text-deep-ink font-medium">{patient.email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate">
                  <Phone className="w-4 h-4 text-slate shrink-0" />
                  <span className="text-deep-ink font-medium">{patient.phone}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Clinical Profile (Conditions, Allergies, Meds) */}
          <Card className="p-6 space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate mb-3">
                Active Medical Conditions
              </p>
              <div className="flex flex-wrap gap-2">
                {patient.medicalHistory.map((cond, idx) => (
                  <Badge key={idx} variant="secondary" className="px-3 py-1">
                    {cond}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="border-t border-deep-ink/10 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate mb-3">
                Known Allergies
              </p>
              <div className="flex flex-wrap gap-2">
                {patient.allergies.map((allergy, idx) => (
                  <Badge key={idx} variant="danger" className="px-3 py-1">
                    {allergy}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="border-t border-deep-ink/10 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate mb-3">
                Current Medications
              </p>
              <ul className="space-y-2">
                {patient.currentMedications.map((med, idx) => (
                  <li key={idx} className="text-sm text-deep-ink flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-hi-yellow rounded-full shrink-0" />
                    <span>{med}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          {/* Consultation History */}
          <div className="space-y-3">
            <h3 className="text-xl font-bold font-serif text-deep-ink">Consultation History</h3>
            <div className="space-y-3">
              {sessions.map(session => (
                <Card key={session.id} className="p-5 hover:border-hi-yellow/60 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-slate">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{session.date}</span>
                        <span>•</span>
                        <span>{session.provider}</span>
                      </div>
                      <p className="text-sm font-medium text-deep-ink">{session.summary}</p>
                    </div>
                    <Link href={`/dashboard/doctor/sessions/${session.id}`}>
                      <Button size="sm" variant="outline" className="rounded-full text-xs font-semibold">
                        View Note
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar / Quick Notes */}
        <div className="space-y-6">
          <Card className="p-6 bg-soft-meadow border-deep-ink/10 space-y-3">
            <h3 className="font-semibold font-serif text-deep-ink text-base">Clinical Notes</h3>
            <p className="text-sm text-slate leading-relaxed">{patient.notes}</p>
          </Card>

          <Card className="p-6 space-y-3">
            <h3 className="font-semibold font-serif text-deep-ink text-base">Patient Actions</h3>
            <div className="space-y-2">
              <Button className="w-full rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 font-medium">
                Edit Patient Info
              </Button>
              <Button variant="outline" className="w-full rounded-full border-deep-ink/20 text-deep-ink hover:bg-soft-meadow font-medium">
                Message Patient
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
