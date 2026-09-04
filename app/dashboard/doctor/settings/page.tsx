'use client'

import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { ErrorAlert } from '@/components/ui/error-alert'
import { useDoctorStore } from '@/lib/stores/doctor.store'

type SettingsFormState = {
  name: string
  specialty: string
  clinic: string
  phone: string
  avatar: string
}

const defaultFormState: SettingsFormState = {
  name: '',
  specialty: '',
  clinic: '',
  phone: '',
  avatar: '',
}

export default function DoctorSettingsPage() {
  const doctor = useDoctorStore(state => state.doctor)
  const doctorId = useDoctorStore(state => state.doctorId)
  const isSaving = useDoctorStore(state => state.isSaving)
  const isLoading = useDoctorStore(state => state.isLoading)
  const error = useDoctorStore(state => state.error)
  const loadDashboard = useDoctorStore(state => state.loadDashboard)
  const updateDoctorProfile = useDoctorStore(state => state.updateDoctorProfile)

  const [formState, setFormState] = useState<SettingsFormState>(defaultFormState)
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (doctor) {
      setFormState({
        name: doctor.name || '',
        specialty: doctor.specialty || '',
        clinic: doctor.clinic || '',
        phone: doctor.phone || '',
        avatar: doctor.avatar || '',
      })
    }
  }, [doctor])

  useEffect(() => {
    if (!doctor && doctorId) {
      void loadDashboard(doctorId)
    }
  }, [doctor, doctorId, loadDashboard])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target
    setSuccess('')
    setFormState(previous => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSuccess('')

    const updatedDoctor = await updateDoctorProfile({
      name: formState.name,
      specialty: formState.specialty,
      clinic: formState.clinic,
      phone: formState.phone || undefined,
      avatar: formState.avatar || undefined,
    })

    if (updatedDoctor) {
      setSuccess('Profile saved to DynamoDB.')
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold font-serif mb-2">Profile and preferences</h1>
      </div>

      {error && <ErrorAlert message={error} />}

      {success && (
        <div className="rounded-3xl border border-moss-green/30 bg-moss-green/10 p-4 text-sm text-deep-ink">
          {success}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <form onSubmit={handleSubmit} className="rounded-3xl border border-deep-ink/10 bg-white p-4 sm:p-6 space-y-5">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold font-serif mb-1">Edit profile</h2>
            <p className="text-xs sm:text-sm text-slate">Change how you appear across the dashboard.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-deep-ink mb-1">Name</label>
              <input
                name="name"
                value={formState.name}
                onChange={handleChange}
                className="w-full rounded-full border border-deep-ink/20 px-4 py-2 text-deep-ink focus:outline-none focus:ring-2 focus:ring-hi-yellow text-base sm:text-sm"
                placeholder="Dr. Alex Rivera"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-deep-ink mb-1">Specialty</label>
              <select
                name="specialty"
                value={formState.specialty}
                onChange={handleChange}
                className="w-full rounded-full border border-deep-ink/20 px-4 py-2 text-deep-ink focus:outline-none focus:ring-2 focus:ring-hi-yellow text-base sm:text-sm"
              >
                <option value="">Select specialty</option>
                <option value="General Practice">General Practice</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Neurology">Neurology</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Psychiatry">Psychiatry</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-deep-ink mb-1">Clinic</label>
              <input
                name="clinic"
                value={formState.clinic}
                onChange={handleChange}
                className="w-full rounded-full border border-deep-ink/20 px-4 py-2 text-deep-ink focus:outline-none focus:ring-2 focus:ring-hi-yellow text-base sm:text-sm"
                placeholder="North Star Health"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-deep-ink mb-1">Phone</label>
              <input
                name="phone"
                value={formState.phone}
                onChange={handleChange}
                className="w-full rounded-full border border-deep-ink/20 px-4 py-2 text-deep-ink focus:outline-none focus:ring-2 focus:ring-hi-yellow text-base sm:text-sm"
                placeholder="(555) 123-4567"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-deep-ink mb-1">Avatar URL</label>
              <input
                name="avatar"
                value={formState.avatar}
                onChange={handleChange}
                className="w-full rounded-full border border-deep-ink/20 px-4 py-2 text-deep-ink focus:outline-none focus:ring-2 focus:ring-hi-yellow text-base sm:text-sm"
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button type="submit" disabled={isSaving || isLoading} className="w-full sm:w-auto rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90">
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => doctorId && void loadDashboard(doctorId)}
              className="w-full sm:w-auto rounded-full border-deep-ink/20 text-deep-ink hover:bg-soft-meadow"
            >
              Reload
            </Button>
          </div>
        </form>

        <div className="space-y-6">
          <div className="rounded-3xl border border-deep-ink/10 bg-soft-meadow p-6">
            <h2 className="text-lg font-semibold font-serif mb-4">Profile preview</h2>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-hi-yellow flex items-center justify-center font-serif font-bold text-lg text-deep-ink border border-deep-ink/10 overflow-hidden shrink-0">
                {(formState.avatar || doctor?.avatar) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={formState.avatar || doctor?.avatar}
                    alt={formState.name || doctor?.name || 'Doctor'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (formState.name || doctor?.name || 'D').charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-deep-ink truncate">{formState.name || doctor?.name || 'Doctor Name'}</p>
                <p className="text-xs text-slate truncate">{formState.specialty || doctor?.specialty || 'Specialty not selected'}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm text-deep-ink border-t border-deep-ink/10 pt-3">
              <p><span className="text-slate">Clinic:</span> {formState.clinic || doctor?.clinic || 'Not set'}</p>
              <p><span className="text-slate">Phone:</span> {formState.phone || doctor?.phone || 'Not set'}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-deep-ink/10 bg-white p-6 space-y-4">
            <h2 className="text-lg font-semibold font-serif">Other things</h2>
            <div className="space-y-3 text-sm text-slate">
              <div className="rounded-2xl bg-soft-meadow/40 p-4">
                Notification preferences, security settings, and export controls can live here.
              </div>
              <div className="rounded-2xl bg-soft-meadow/40 p-4">
                Session defaults and automation rules should use the same contract pattern as the profile fields.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
