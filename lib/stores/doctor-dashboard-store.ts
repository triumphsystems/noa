import { create } from 'zustand'

import type { DoctorDashboardPayload, DoctorProfile, DoctorProfileUpdateInput } from '@/lib/contracts/doctor-dashboard'
import type { Patient, Session } from '@/lib/db'

interface DoctorDashboardState {
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

const fetchJson = async <T,>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    cache: 'no-store',
    ...init,
  })
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Request failed')
  }

  return data.data as T
}

export const useDoctorDashboardStore = create<DoctorDashboardState>((set, get) => ({
  ...initialState,

  setDoctorId: doctorId => set({ doctorId }),

  loadDashboard: async doctorId => {
    const activeDoctorId = doctorId ?? get().doctorId

    if (!activeDoctorId) {
      set({ error: 'A doctor ID is required to load the dashboard' })
      return
    }

    set({ isLoading: true, error: null, doctorId: activeDoctorId })

    try {
      const payload = await fetchJson<DoctorDashboardPayload>(
        `/api/dashboard/doctor?doctorId=${encodeURIComponent(activeDoctorId)}`,
      )

      set({
        doctor: payload.doctor,
        patients: payload.patients,
        sessions: payload.sessions,
        stats: payload.stats,
        isLoading: false,
        lastLoadedDoctorId: activeDoctorId,
      })
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load dashboard',
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
      const updatedDoctor = await fetchJson<DoctorProfile>(`/api/doctors/${encodeURIComponent(doctorId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

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
