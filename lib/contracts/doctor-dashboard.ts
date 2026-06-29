import type { Doctor, Patient, Session } from '@/lib/db'

export type DoctorProfile = Doctor
export type DoctorProfileUpdateInput = Partial<Pick<Doctor, 'name' | 'specialty' | 'clinic' | 'phone' | 'avatar'>>

export interface DoctorDashboardStats {
  totalPatients: number
  totalSessions: number
  completedSessions: number
  activeSessions: number
  pendingNotes: number
  todaySessions: number
}

export interface DoctorDashboardPayload {
  doctor: DoctorProfile
  patients: Patient[]
  sessions: Session[]
  stats: DoctorDashboardStats
}

export interface ApiSuccess<T> {
  success: true
  data: T
}
