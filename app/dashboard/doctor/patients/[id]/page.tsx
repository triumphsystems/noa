'use client'

import * as React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Calendar,
  FileText,
  Mail,
  Mic,
  Phone,
  User,
  Loader2,
  AlertCircle,
  Check,
  Copy,
  ShieldCheck,
  HeartPulse,
  Pill,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react'
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
  const [copiedId, setCopiedId] = React.useState(false)

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

  const handleCopyId = () => {
    if (!navigator.clipboard || !patient?.id) return
    navigator.clipboard.writeText(patient.id)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  if (isLoading && !patient) {
    return (
      <div className="p-16 text-center text-slate text-sm max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[400px] gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-deep-ink/60" />
        <span className="font-medium text-deep-ink">Loading patient record...</span>
        <span className="text-xs text-slate">Retrieving verified clinical profile and past consultations</span>
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

  // Safe Name Resolution: Prevent literal "undefined undefined"
  const nameParts = [patient.firstName, patient.lastName].filter(
    val => Boolean(val) && typeof val === 'string' && val.trim() !== '' && val.trim().toLowerCase() !== 'undefined'
  )
  const fullName =
    nameParts.length > 0
      ? nameParts.join(' ').trim()
      : (patient as any).name || (patient.email ? patient.email.split('@')[0] : '') || `Patient #${patient.id.slice(0, 8)}`

  const initials =
    nameParts.length > 0
      ? nameParts.map(p => p[0]).join('').slice(0, 2).toUpperCase()
      : fullName.slice(0, 2).toUpperCase()

  const medicalHistory = patient.conditions || []
  const allergies = patient.allergies || []
  const currentMedications = patient.medications || []

  // Compute age from DOB if present
  let ageDisplay = '—'
  if (patient.dateOfBirth) {
    const birthYear = new Date(patient.dateOfBirth).getFullYear()
    if (!isNaN(birthYear)) {
      const calculated = new Date().getFullYear() - birthYear
      if (calculated > 0 && calculated < 130) {
        ageDisplay = `${calculated} yrs`
      }
    }
  }

  const isLinked = patient.linkStatus === 'linked'
  const isPendingConsent = patient.linkStatus === 'pending_patient_approval'
  const displayStatus = isLinked
    ? 'Active & Linked'
    : isPendingConsent
    ? 'Consent Pending'
    : patient.linkStatus
    ? patient.linkStatus.replace(/_/g, ' ')
    : 'Consent Pending'

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/dashboard/doctor/patients"
          className="text-xs font-semibold text-slate hover:text-deep-ink flex items-center gap-1.5 transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Patients Registry</span>
          <span className="text-slate/40">/</span>
          <span className="text-deep-ink truncate max-w-[200px] sm:max-w-none">{fullName}</span>
        </Link>
      </div>

      {/* Patient Profile Hero Banner */}
      <Card className="p-5 sm:p-7 bg-white border border-deep-ink/10 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-deep-ink/8">
          <div className="flex items-center gap-4 min-w-0">
            {/* Avatar Initials Badge */}
            <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-800 border border-teal-200/80 flex items-center justify-center font-serif font-bold text-xl shrink-0 shadow-2xs">
              {initials}
            </div>

            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold font-serif text-deep-ink tracking-tight">
                  {fullName}
                </h1>
                <Badge
                  variant={isLinked ? 'success' : 'secondary'}
                  className={
                    isLinked
                      ? 'text-xs'
                      : 'text-xs bg-amber-50 text-amber-900 border-amber-200 font-semibold'
                  }
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                      isLinked ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                    }`}
                  />
                  {displayStatus}
                </Badge>
              </div>

              {/* ID with Quick Copy */}
              <div className="flex items-center gap-2 text-xs text-slate">
                <span className="font-mono bg-soft-meadow/70 px-2 py-0.5 rounded border border-deep-ink/8">
                  ID: {patient.id}
                </span>
                <button
                  onClick={handleCopyId}
                  title="Copy Patient ID"
                  aria-label="Copy Patient ID"
                  className="hover:text-deep-ink transition-colors p-0.5 cursor-pointer"
                >
                  {copiedId ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate/80" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Primary Action Button (No duplicate locked buttons) */}
          <div className="flex items-center gap-3 shrink-0">
            {isLinked ? (
              <Link href={`/dashboard/doctor/sessions/new?patientId=${patient.id}`} className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 gap-2 font-medium text-xs sm:text-sm shadow-2xs cursor-pointer px-5">
                  <Mic className="h-4 w-4" />
                  <span>Start Voice Session</span>
                </Button>
              </Link>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  if (patient.email) {
                    window.open(`mailto:${patient.email}?subject=Invitation%20from%20Dr.%20${doctor?.name || 'Clinic'}`)
                  } else {
                    alert('No email recorded for this patient')
                  }
                }}
                className="w-full sm:w-auto rounded-full border-deep-ink/20 text-deep-ink hover:bg-soft-meadow font-medium text-xs sm:text-sm cursor-pointer gap-2"
              >
                <Mail className="w-3.5 h-3.5 text-slate" />
                <span>Contact Patient</span>
              </Button>
            )}
          </div>
        </div>

        {/* Quick Demographic Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 text-xs pt-1">
          <div className="p-2.5 rounded-xl bg-soft-meadow/40 border border-deep-ink/5">
            <span className="text-slate block text-[11px] mb-0.5">Age</span>
            <span className="font-semibold text-deep-ink text-sm">{ageDisplay}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-soft-meadow/40 border border-deep-ink/5">
            <span className="text-slate block text-[11px] mb-0.5">Gender</span>
            <span className="font-semibold text-deep-ink text-sm capitalize">{patient.gender || '—'}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-soft-meadow/40 border border-deep-ink/5">
            <span className="text-slate block text-[11px] mb-0.5">Date of Birth</span>
            <span className="font-semibold text-deep-ink text-sm">{patient.dateOfBirth || '—'}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-soft-meadow/40 border border-deep-ink/5">
            <span className="text-slate block text-[11px] mb-0.5">Status</span>
            <span className="font-semibold text-deep-ink text-sm capitalize">{displayStatus}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-soft-meadow/40 border border-deep-ink/5 sm:col-span-2 lg:col-span-2">
            <span className="text-slate block text-[11px] mb-0.5">Contact Email</span>
            <span className="font-semibold text-deep-ink text-sm truncate block" title={patient.email}>
              {patient.email || '—'}
            </span>
          </div>
        </div>
      </Card>

      {/* Consent Pending Banner */}
      {!isLinked && (
        <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm shadow-2xs">
          <div className="flex items-start sm:items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5 sm:mt-0" />
            <p className="leading-relaxed">
              <span className="font-semibold">Connection Pending Patient Approval: </span>
              This patient has not yet connected with your clinic on their health portal. Clinical records, past summaries, and AI voice intakes will synchronize once approved.
            </p>
          </div>
          {patient.email && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => alert(`Invitation reminder email triggered for ${patient.email}`)}
              className="shrink-0 rounded-xl border-amber-300 text-amber-900 hover:bg-amber-100 text-xs font-semibold h-8"
            >
              Send Reminder
            </Button>
          )}
        </div>
      )}

      {/* Desktop 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Main Column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Clinical Profile Grid (Conditions, Allergies, Meds) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Active Conditions */}
            <Card className="p-5 bg-white border border-deep-ink/10 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-deep-ink pb-2 border-b border-deep-ink/6">
                <HeartPulse className="w-4 h-4 text-emerald-600" />
                <h3 className="font-serif font-bold text-sm">Active Medical Conditions</h3>
              </div>
              {medicalHistory.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate bg-soft-meadow/30 rounded-xl border border-dashed border-deep-ink/10">
                  <p className="italic">No active conditions recorded</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {medicalHistory.map((cond, idx) => (
                    <Badge key={idx} variant="secondary" className="px-2.5 py-1 text-xs">
                      {cond}
                    </Badge>
                  ))}
                </div>
              )}
            </Card>

            {/* Known Allergies */}
            <Card className="p-5 bg-white border border-deep-ink/10 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-deep-ink pb-2 border-b border-deep-ink/6">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <h3 className="font-serif font-bold text-sm">Known Allergies</h3>
              </div>
              {allergies.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate bg-soft-meadow/30 rounded-xl border border-dashed border-deep-ink/10">
                  <p className="italic">No known allergies documented</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {allergies.map((allergy, idx) => (
                    <Badge key={idx} variant="danger" className="px-2.5 py-1 text-xs">
                      {allergy}
                    </Badge>
                  ))}
                </div>
              )}
            </Card>

            {/* Current Medications */}
            <Card className="p-5 bg-white border border-deep-ink/10 shadow-2xs space-y-3 md:col-span-2">
              <div className="flex items-center justify-between pb-2 border-b border-deep-ink/6">
                <div className="flex items-center gap-2 text-deep-ink">
                  <Pill className="w-4 h-4 text-amber-600" />
                  <h3 className="font-serif font-bold text-sm">Current Prescriptions & Medications</h3>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {currentMedications.length} on file
                </Badge>
              </div>
              {currentMedications.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate bg-soft-meadow/30 rounded-xl border border-dashed border-deep-ink/10">
                  <p className="italic">No current medications reported on file</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {currentMedications.map((med, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-soft-meadow/40 border border-deep-ink/5 text-xs text-deep-ink flex items-center gap-2"
                    >
                      <span className="w-2 h-2 bg-hi-yellow rounded-full shrink-0" />
                      <span className="font-medium truncate">{med}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Consultation History */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate" />
                <h3 className="text-base sm:text-lg font-bold font-serif text-deep-ink">
                  Consultation History
                </h3>
              </div>
              <Badge variant="secondary" className="text-xs">
                {sessions.length} recorded
              </Badge>
            </div>

            {sessions.length === 0 ? (
              <Card className="p-8 text-center border-dashed rounded-2xl bg-white/70 space-y-2">
                <Clock className="w-8 h-8 text-slate/30 mx-auto" />
                <p className="text-xs font-medium text-slate">No past consultations recorded for this patient.</p>
                <p className="text-[11px] text-slate/70">
                  Completed voice sessions and AI-generated SOAP notes will be stored here.
                </p>
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
                  const summaryText = s.soapNote?.assessment || s.transcript || 'Clinical consultation recorded.'

                  return (
                    <Card key={s.id} className="p-4 sm:p-5 hover:border-deep-ink/30 transition-all bg-white shadow-2xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 text-xs text-slate flex-wrap">
                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                            <span>{sDate}</span>
                            <span>•</span>
                            <span>{doctor?.name ? `Dr. ${doctor.name}` : 'Clinical Center'}</span>
                            <Badge
                              variant={s.status === 'completed' ? 'success' : 'secondary'}
                              className="text-[10px] px-1.5 py-0"
                            >
                              {s.status}
                            </Badge>
                          </div>
                          <p className="text-xs sm:text-sm font-medium text-deep-ink line-clamp-1">
                            {summaryText}
                          </p>
                        </div>
                        <Link href={`/dashboard/doctor/sessions/${s.id}`} className="shrink-0">
                          <Button size="sm" variant="outline" className="rounded-xl text-xs font-semibold h-8 cursor-pointer">
                            View Clinical Note
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

        {/* Sidebar / Provider Governance Rail */}
        <div className="space-y-4">
          {/* Clinical Record Governance Card */}
          <Card className="p-5 bg-white border border-deep-ink/10 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-deep-ink">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="font-serif font-bold text-sm">Clinical Record Security</h3>
            </div>
            <p className="text-xs text-slate leading-relaxed">
              Patient registered on{' '}
              <span className="font-semibold text-deep-ink">
                {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : 'Active File'}
              </span>
              . All clinical consultations, AI intake summaries, and SOAP notes are end-to-end encrypted and linked to your National Provider identifier.
            </p>
          </Card>

          {/* Provider Quick Actions Card */}
          <Card className="p-5 bg-white border border-deep-ink/10 shadow-2xs space-y-3">
            <h3 className="font-serif font-bold text-sm text-deep-ink">Provider Actions</h3>
            <div className="space-y-2">
              {isLinked ? (
                <Link href={`/dashboard/doctor/sessions/new?patientId=${patient.id}`} className="block">
                  <Button className="w-full rounded-xl bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 font-medium text-xs h-9 cursor-pointer shadow-2xs">
                    Start Voice Session
                  </Button>
                </Link>
              ) : (
                <div className="p-3 rounded-xl bg-soft-meadow/50 border border-deep-ink/5 text-xs text-slate space-y-1">
                  <span className="font-semibold text-deep-ink block">Voice Session Inactive</span>
                  <p className="text-[11px] leading-relaxed">
                    Voice encounters and transcript processing will activate automatically once the patient confirms linkage.
                  </p>
                </div>
              )}

              <Button
                variant="outline"
                onClick={() => {
                  if (patient.email) {
                    window.open(`mailto:${patient.email}`)
                  } else {
                    alert('No email recorded for this patient')
                  }
                }}
                className="w-full rounded-xl border-deep-ink/15 text-deep-ink hover:bg-soft-meadow font-semibold text-xs h-9 cursor-pointer"
              >
                Direct Email Patient
              </Button>

              <Button
                variant="outline"
                onClick={handleCopyId}
                className="w-full rounded-xl border-deep-ink/15 text-slate hover:text-deep-ink hover:bg-soft-meadow text-xs h-9 cursor-pointer"
              >
                {copiedId ? 'Copied Patient ID!' : 'Copy Patient ID'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

