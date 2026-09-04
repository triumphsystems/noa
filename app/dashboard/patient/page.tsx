'use client'

import { useEffect } from 'react'
import { usePatientStore } from '@/lib/stores/patient.store'
import { WelcomeBanner } from '@/components/patient/welcome-banner'
import { PatientStatsGrid } from '@/components/patient/patient-stats-grid'
import { ConsultationsList } from '@/components/patient/consultations-list'
import { HealthInfoCard } from '@/components/patient/health-info-card'
import { PrivacyNoticeCard } from '@/components/patient/privacy-notice-card'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ErrorAlert } from '@/components/ui/error-alert'

export default function PatientDashboardPage() {
  const {
    patientId,
    patient,
    doctor,
    sessions,
    intake,
    stats,
    isLoading,
    error,
    setPatientId,
    loadDashboard,
  } = usePatientStore()

  useEffect(() => {
    let resolvedId = patientId
    if (!resolvedId && typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('patientId')
      if (stored) {
        resolvedId = stored
        setPatientId(stored)
      }
    }

    if (resolvedId && !patient) {
      void loadDashboard(resolvedId)
    }
  }, [patientId, patient, setPatientId, loadDashboard])

  const fullName = patient ? `${patient.firstName} ${patient.lastName}`.trim() : ''

  if (isLoading && !patient) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="h-32 bg-deep-ink/5 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-24 bg-deep-ink/5 rounded-xl" />
          <div className="h-24 bg-deep-ink/5 rounded-xl" />
          <div className="h-24 bg-deep-ink/5 rounded-xl" />
        </div>
        <div className="h-48 bg-deep-ink/5 rounded-2xl" />
      </div>
    )
  }

  if (error && !patient) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-4">
        <ErrorAlert
          variant="card"
          title="Unable to Load Health Portal"
          message={error}
        />
        <div className="text-center">
          <Button
            variant="outline"
            className="rounded-full text-xs"
            onClick={() => patientId && void loadDashboard(patientId)}
          >
            Retry Loading
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-5xl mx-auto">
      <WelcomeBanner
        name={fullName}
        hasDoctor={Boolean(patient?.doctorId)}
        doctorName={doctor?.name}
      />
      <PatientStatsGrid stats={stats} />
      <ConsultationsList sessions={sessions} doctor={doctor} />
      <HealthInfoCard patient={patient} intake={intake} />
      <PrivacyNoticeCard />
    </div>
  )
}
