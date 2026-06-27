'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

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

export default function PatientProfilePage({ params }: { params: { id: string } }) {
  const [patient] = useState(mockPatientProfile)
  const [sessions] = useState(mockSessions)

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif mb-2">{patient.name}</h1>
          <p className="text-slate">Patient ID: {patient.id}</p>
        </div>
        <Link href={`/dashboard/sessions/new?patientId=${patient.id}`}>
          <Button className="rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90">
            Start Session
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Demographics */}
          <div className="bg-white rounded-3xl p-8 border border-deep-ink/10">
            <h2 className="text-xl font-semibold font-serif mb-6">Demographics</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-slate mb-1">Age</p>
                <p className="text-lg font-semibold text-deep-ink">{patient.age} years old</p>
              </div>
              <div>
                <p className="text-sm text-slate mb-1">Gender</p>
                <p className="text-lg font-semibold text-deep-ink">{patient.gender}</p>
              </div>
              <div>
                <p className="text-sm text-slate mb-1">Date of Birth</p>
                <p className="text-lg font-semibold text-deep-ink">{patient.dateOfBirth}</p>
              </div>
              <div>
                <p className="text-sm text-slate mb-1">Email</p>
                <p className="text-lg font-semibold text-deep-ink">{patient.email}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-slate mb-1">Phone</p>
                <p className="text-lg font-semibold text-deep-ink">{patient.phone}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-slate mb-1">Address</p>
                <p className="text-lg font-semibold text-deep-ink">{patient.address}</p>
              </div>
            </div>
          </div>

          {/* Medical History */}
          <div className="bg-white rounded-3xl p-8 border border-deep-ink/10">
            <h2 className="text-xl font-semibold font-serif mb-6">Medical History</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-deep-ink mb-2">Conditions</h3>
                <div className="flex flex-wrap gap-2">
                  {patient.medicalHistory.map((condition, idx) => (
                    <span key={idx} className="bg-slate/10 text-slate text-sm px-3 py-1 rounded-full">
                      {condition}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-medium text-deep-ink mb-2">Allergies</h3>
                <div className="flex flex-wrap gap-2">
                  {patient.allergies.map((allergy, idx) => (
                    <span key={idx} className="bg-red-100 text-red-800 text-sm px-3 py-1 rounded-full">
                      {allergy}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-medium text-deep-ink mb-2">Current Medications</h3>
                <ul className="space-y-2">
                  {patient.currentMedications.map((med, idx) => (
                    <li key={idx} className="text-sm text-slate flex items-center gap-2">
                      <span className="w-2 h-2 bg-hi-yellow rounded-full" />
                      {med}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Session History */}
          <div className="bg-white rounded-3xl p-8 border border-deep-ink/10">
            <h2 className="text-xl font-semibold font-serif mb-6">Session History</h2>
            <div className="space-y-3">
              {sessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 bg-soft-meadow/50 rounded-2xl">
                  <div>
                    <p className="font-medium text-deep-ink">{session.date}</p>
                    <p className="text-sm text-slate">{session.summary}</p>
                    <p className="text-xs text-slate mt-1">Provider: {session.provider}</p>
                  </div>
                  <Link href={`/dashboard/sessions/${session.id}`}>
                    <button className="text-hi-yellow hover:underline font-medium">View</button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Card */}
          <div className="bg-soft-meadow rounded-3xl p-6 border border-deep-ink/10">
            <h3 className="font-semibold font-serif text-deep-ink mb-4">Quick Contact</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate mb-1">Emergency Contact</p>
                <p className="text-sm font-medium text-deep-ink">{patient.emergencyContact}</p>
              </div>
              <div>
                <p className="text-xs text-slate mb-1">Primary Phone</p>
                <p className="text-sm font-medium text-deep-ink">{patient.phone}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-3xl p-6 border border-deep-ink/10">
            <h3 className="font-semibold font-serif text-deep-ink mb-4">Clinical Notes</h3>
            <p className="text-sm text-slate leading-relaxed">{patient.notes}</p>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Button className="w-full rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90">
              Edit Profile
            </Button>
            <Button variant="outline" className="w-full rounded-full border-deep-ink text-deep-ink hover:bg-soft-meadow">
              Message Patient
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
