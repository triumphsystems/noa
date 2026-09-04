import { create } from 'zustand'
import type { PatientDashboardPayload, PatientProfile } from '@/lib/types/patient.types'
import type { Doctor, PatientIntake, Session } from '@/lib/db'
import { http } from '@/lib/http'

export interface PatientState {
  patientId: string | null
  patient: PatientProfile | null
  doctor: Doctor | null
  pendingDoctor: Doctor | null
  sessions: Session[]
  intake: PatientIntake | null
  stats: PatientDashboardPayload['stats'] | null
  isLoading: boolean
  error: string | null
  setPatientId: (patientId: string | null) => void
  loadDashboard: (patientId?: string) => Promise<void>
  clearDashboard: () => void
}

const initialState = {
  patientId: null,
  patient: null,
  doctor: null,
  pendingDoctor: null,
  sessions: [],
  intake: null,
  stats: null,
  isLoading: false,
  error: null,
}

export const usePatientStore = create<PatientState>((set, get) => ({
  ...initialState,

  setPatientId: patientId => set({ patientId }),

  loadDashboard: async patientId => {
    const activeId = patientId ?? get().patientId

    if (!activeId) {
      set({ error: 'A patient ID is required to load patient data' })
      return
    }

    set({ isLoading: true, error: null, patientId: activeId })

    try {
      const payload = await http<PatientDashboardPayload>(
        `/api/dashboard/patient?patientId=${encodeURIComponent(activeId)}`
      )

      set({
        patient: payload.patient,
        doctor: payload.doctor,
        pendingDoctor: payload.pendingDoctor || null,
        sessions: payload.sessions,
        intake: payload.intake,
        stats: payload.stats,
        isLoading: false,
      })
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load patient data',
      })
    }
  },

  clearDashboard: () => set(initialState),
}))
