import { create } from 'zustand'

import type { DoctorDashboardPayload, DoctorProfile, DoctorProfileUpdateInput } from '@/lib/types/doctor.types'
import type { Patient, Session } from '@/lib/db'
import { http } from '@/lib/http'

export interface DoctorState {
  doctorId: string | null
  doctor: DoctorProfile | null
  patients: Patient[]
  sessions: Session[]
  stats: DoctorDashboardPayload['stats'] | null
  isLoading: boolean
  isSaving: boolean
  error: string | null
  lastLoadedDoctorId: string | null
  setDoctorId: (doctorId: string | null) => void
  loadDashboard: (doctorId?: string) => Promise<void>
  updateDoctorProfile: (updates: DoctorProfileUpdateInput) => Promise<DoctorProfile | null>
  clearDashboard: () => void
}

const initialState = {
  doctorId: null,
  doctor: null,
  patients: [],
  sessions: [],
  stats: null,
  isLoading: false,
  isSaving: false,
  error: null,
  lastLoadedDoctorId: null,
}

export const useDoctorStore = create<DoctorState>((set, get) => ({
  ...initialState,

  setDoctorId: doctorId => set({ doctorId }),

  loadDashboard: async doctorId => {
    const activeDoctorId = doctorId ?? get().doctorId

    if (!activeDoctorId) {
      set({ error: 'A doctor ID is required to load doctor data' })
      return
    }

    set({ isLoading: true, error: null, doctorId: activeDoctorId })

    try {
      const payload = await http<DoctorDashboardPayload>(
        `/api/dashboard/doctor?doctorId=${encodeURIComponent(activeDoctorId)}`,
      )

      const canonicalId = payload.doctor?.id || activeDoctorId
      if (typeof window !== 'undefined' && canonicalId) {
        window.localStorage.setItem('doctorId', canonicalId)
      }

      set({
        doctor: payload.doctor,
        patients: payload.patients,
        sessions: payload.sessions,
        stats: payload.stats,
        doctorId: canonicalId,
        isLoading: false,
        lastLoadedDoctorId: canonicalId,
      })
    } catch (error) {
      // If 403 or dashboard fetch fails (e.g. pending/rejected credentials), load doctor profile directly
      try {
        const res = await http<{ success: boolean; data: DoctorProfile }>(
          `/api/doctors/${encodeURIComponent(activeDoctorId)}`
        )
        if (res.data) {
          set({
            doctor: res.data,
            isLoading: false,
            error: error instanceof Error ? error.message : null,
            lastLoadedDoctorId: activeDoctorId,
          })
          return
        }
      } catch {
        // Fall through to error
      }

      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load doctor data',
      })
    }
  },

  updateDoctorProfile: async updates => {
    const { doctorId } = get()

    if (!doctorId) {
      set({ error: 'A doctor ID is required to update the profile' })
      return null
    }

    set({ isSaving: true, error: null })

    try {
      const res = await http.put<{ success: boolean; data: DoctorProfile }>(
        `/api/doctors/${encodeURIComponent(doctorId)}`,
        updates,
      )

      const updatedDoctor = (res as any)?.data || (res as any)

      set({
        doctor: updatedDoctor,
        isSaving: false,
        error: null,
      })

      return updatedDoctor
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Failed to update profile',
      })
      return null
    }
  },

  clearDashboard: () => set(initialState),
}))
