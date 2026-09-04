import type { Doctor, Patient, PatientIntake, Session } from '@/lib/db'

export type PatientProfile = Patient

export interface PatientStats {
  totalConsultations: number
  completedConsultations: number
  activeConsultations: number
  hasIntake: boolean
}

export interface PatientDashboardPayload {
  patient: PatientProfile
  doctor: Doctor | null
  sessions: Session[]
  intake: PatientIntake | null
  stats: PatientStats
}
