'use client'

import * as React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Calendar, FileText, Mail, Mic, Phone, User, Loader2, AlertCircle } from 'lucide-react'
import { useDoctorStore } from '@/lib/stores/doctor.store'
import type { Patient, Session } from '@/lib/db'

export default function PatientProfilePage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string }
}) {
  const unwrappedParams = React.use(params instanceof Promise ? params : Promise.resolve(params))
  const patientId = unwrappedParams.id

  const doctor = useDoctorStore(state => state.doctor)
  const storePatients = useDoctorStore(state => state.patients)
  const storeSessions = useDoctorStore(state => state.sessions)

  const [patient, setPatient] = React.useState<Patient | null>(null)
  const [sessions, setSessions] = React.useState<Session[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    async function fetchPatientData() {
      setError(null)
      try {
        // Quick seed from store if available and populated
        const cached = storePatients.find(p => p.id === patientId && p.email && p.firstName) || null
        if (cached) {
          setPatient(cached)
          setIsLoading(false)
        } else {
          setIsLoading(true)
        }

        // Always fetch fresh authoritative record from API
        const res = await fetch(`/api/patients/${encodeURIComponent(patientId)}`)
        const data = await res.json()
        if (res.ok && data.patient) {
          setPatient(data.patient)
        } else if (!cached) {
          throw new Error(data.error || data.message || 'Failed to fetch patient record')
        }

        // Find patient sessions
        let patientSessions = storeSessions.filter(s => s.patientId === patientId)
        if (patientSessions.length === 0) {
          const sRes = await fetch(`/api/sessions?patientId=${encodeURIComponent(patientId)}`)
          const sData = await sRes.json()
          if (sRes.ok && Array.isArray(sData.sessions)) {
            patientSessions = sData.sessions
          }
        }
        setSessions(patientSessions.sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0)))
      } catch (err: any) {
        setError(err.message || 'Failed to load patient record')
      } finally {
        setIsLoading(false)
      }
    }

    if (patientId) {
      void fetchPatientData()
    }
  }, [patientId, storePatients, storeSessions])

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate text-sm max-w-5xl mx-auto flex flex-col items-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-deep-ink/50" />
        <span>Loading patient record...</span>
      </div>
    )
  }

  if (error || !patient) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <Link
          href="/dashboard/doctor/patients"
          className="text-xs font-semibold text-slate hover:text-deep-ink flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Patients Registry</span>
        </Link>
        <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center gap-3 text-xs sm:text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{error || 'Patient not found.'}</span>
        </div>
      </div>
    )
  }

  const nameParts = [patient.firstName, patient.lastName].filter(Boolean)
  const fullName = nameParts.length > 0 ? nameParts.join(' ').trim() : (patient.name || patient.email || `Patient #${patient.id.slice(-6)}`)
  const medicalHistory = patient.conditions || []
  const allergies = patient.allergies || []
  const currentMedications = patient.medications || []

  // Compute age from DOB if present
  let ageDisplay = '—'
  if (patient.dateOfBirth) {
    const birthYear = new Date(patient.dateOfBirth).getFullYear()
    if (!isNaN(birthYear)) {
      ageDisplay = `${new Date().getFullYear() - birthYear} yrs`
    }
  }

  const isLinked = patient.linkStatus === 'linked'
  const isPendingConsent = patient.linkStatus === 'pending_patient_approval'

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
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
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-deep-ink">{fullName}</h1>
            <Badge variant="secondary" className="text-xs">
              ID: {patient.id}
            </Badge>
            {isPendingConsent && (
              <Badge variant="secondary" className="text-xs bg-amber-50 text-amber-800 border-amber-200 font-semibold">
                Pending Patient Consent
              </Badge>
            )}
          </div>
        </div>

        {isLinked ? (
          <Link href={`/dashboard/doctor/sessions/new?patientId=${patient.id}`} className="block sm:inline">
            <Button className="w-full sm:w-auto rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 gap-2 font-medium text-xs sm:text-sm shadow-2xs cursor-pointer">
              <Mic className="h-4 w-4" />
              Start Voice Session
            </Button>
          </Link>
        ) : (
          <Button disabled variant="outline" className="w-full sm:w-auto rounded-full gap-2 text-xs sm:text-sm opacity-60">
            <Mic className="h-4 w-4" />
            Voice Session Locked (Pending Consent)
          </Button>
        )}
      </div>

      {isPendingConsent && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-3 text-xs sm:text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
          <span>
            This patient has not yet accepted your clinic connection invitation. Clinical history, active conditions, and consultation notes are restricted until the patient accepts on their health portal.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
        {/* Main Content (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Demographics Card */}
          <Card className="p-4 sm:p-6">
            <CardHeader className="p-0 pb-4">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-slate" />
                Demographics & Personal Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-xs text-slate mb-1">Age</p>
                  <p className="font-semibold text-deep-ink">{ageDisplay}</p>
                </div>
                <div>
                  <p className="text-xs text-slate mb-1">Gender</p>
                  <p className="font-semibold text-deep-ink">{patient.gender || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate mb-1">Date of Birth</p>
                  <p className="font-semibold text-deep-ink">{patient.dateOfBirth || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate mb-1">Status</p>
                  <p className="font-semibold text-deep-ink capitalize">{patient.linkStatus ? patient.linkStatus.replace(/_/g, ' ') : 'Active'}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-deep-ink/10 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-slate">
                  <Mail className="w-4 h-4 text-slate shrink-0" />
                  <span className="text-deep-ink font-medium">{patient.email}</span>
                </div>
                <div className="flex items-center gap-2 text-slate">
                  <Phone className="w-4 h-4 text-slate shrink-0" />
                  <span className="text-deep-ink font-medium">{patient.phone || '—'}</span>
                </div>
              </div>

              {patient.address && (
                <div className="mt-3 text-xs text-slate">
                  <span className="font-medium text-deep-ink">Address: </span>
                  {patient.address}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Clinical Profile (Conditions, Allergies, Meds) */}
          <Card className="p-6 space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate mb-3">
                Active Medical Conditions
              </p>
              {medicalHistory.length === 0 ? (
                <p className="text-xs text-slate italic">No active conditions recorded.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {medicalHistory.map((cond, idx) => (
                    <Badge key={idx} variant="secondary" className="px-3 py-1">
                      {cond}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-deep-ink/10 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate mb-3">
                Known Allergies
              </p>
              {allergies.length === 0 ? (
                <p className="text-xs text-slate italic">No allergies reported.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {allergies.map((allergy, idx) => (
                    <Badge key={idx} variant="danger" className="px-3 py-1">
                      {allergy}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-deep-ink/10 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate mb-3">
                Current Medications
              </p>
              {currentMedications.length === 0 ? (
                <p className="text-xs text-slate italic">No medications on file.</p>
              ) : (
                <ul className="space-y-2">
                  {currentMedications.map((med, idx) => (
                    <li key={idx} className="text-sm text-deep-ink flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-hi-yellow rounded-full shrink-0" />
                      <span>{med}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>

          {/* Consultation History */}
          <div className="space-y-3">
            <h3 className="text-lg sm:text-xl font-bold font-serif text-deep-ink">Consultation History</h3>
            {sessions.length === 0 ? (
              <Card className="p-6 text-center text-xs text-slate">
                No past consultations recorded for this patient.
              </Card>
            ) : (
              <div className="space-y-3">
                {sessions.map(s => {
                  const sDate = s.startedAt
                    ? new Date(s.startedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Recent'
                  const summaryText = s.soapNote?.assessment || s.transcript || 'Clinical Consultation'

                  return (
                    <Card key={s.id} className="p-4 sm:p-5 hover:border-hi-yellow/60 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-slate flex-wrap">
                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                            <span>{sDate}</span>
                            <span>•</span>
                            <span>{doctor?.name ? `Dr. ${doctor.name}` : 'Provider'}</span>
                            <Badge variant={s.status === 'completed' ? 'success' : 'secondary'} className="text-[10px] px-1.5 py-0">
                              {s.status}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium text-deep-ink line-clamp-1">{summaryText}</p>
                        </div>
                        <Link href={`/dashboard/doctor/sessions/${s.id}`} className="block sm:inline">
                          <Button size="sm" variant="outline" className="w-full sm:w-auto rounded-full text-xs font-semibold cursor-pointer">
                            View Note
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar / Quick Notes */}
        <div className="space-y-6">
          <Card className="p-6 bg-soft-meadow border-deep-ink/10 space-y-3">
            <h3 className="font-semibold font-serif text-deep-ink text-base">Clinical Record</h3>
            <p className="text-xs text-slate leading-relaxed">
              Patient registered on{' '}
              {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : 'N/A'}. All clinical consultations and AI voice intake summaries are encrypted and linked to your provider ID.
            </p>
          </Card>

          <Card className="p-6 space-y-3">
            <h3 className="font-semibold font-serif text-deep-ink text-base">Quick Actions</h3>
            <div className="space-y-2">
              {isLinked ? (
                <Link href={`/dashboard/doctor/sessions/new?patientId=${patient.id}`} className="block">
                  <Button className="w-full rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 font-medium text-xs cursor-pointer shadow-2xs">
                    Conduct Voice Session
                  </Button>
                </Link>
              ) : (
                <Button disabled variant="outline" className="w-full rounded-full font-medium text-xs opacity-60">
                  Voice Session Locked
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => alert(`Direct email: ${patient.email}`)}
                className="w-full rounded-full border-deep-ink/20 text-deep-ink hover:bg-soft-meadow font-medium text-xs cursor-pointer"
              >
                Contact Patient
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
