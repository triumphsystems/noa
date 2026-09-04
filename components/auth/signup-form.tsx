'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ErrorAlert } from '@/components/ui/error-alert'
import { Stethoscope, User, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

type SignupFormProps = {
  userType: 'doctor' | 'patient'
}

export default function SignupForm({ userType: initialUserType }: SignupFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [userType, setUserType] = useState<'doctor' | 'patient'>(initialUserType)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    specialty: '',
    clinic: '',
    dateOfBirth: '',
    doctorId: '',
  })

  useEffect(() => {
    setUserType(initialUserType)
  }, [initialUserType])

  useEffect(() => {
    const urlDoctorId = searchParams.get('doctorId')
    if (urlDoctorId) {
      setFormData(prev => ({ ...prev, doctorId: urlDoctorId }))
    }
  }, [searchParams])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleRoleChange = (newRole: 'doctor' | 'patient') => {
    setUserType(newRole)
    setError('')
    const url = new URL(window.location.href)
    url.searchParams.set('type', newRole)
    window.history.replaceState({}, '', url.toString())
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userType,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Signup failed')
      }

      if (typeof window !== 'undefined') {
        if (data.doctor?.id) {
          window.localStorage.setItem('doctorId', data.doctor.id)
        }
        if (data.patient?.id) {
          window.localStorage.setItem('patientId', data.patient.id)
        }
        window.localStorage.setItem('userType', userType)
      }

      if (data.isConfirmed) {
        router.push(`/auth/login?verified=true&email=${encodeURIComponent(formData.email)}&type=${userType}`)
      } else {
        router.push(`/auth/login?registered=true&email=${encodeURIComponent(formData.email)}&type=${userType}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Top Segmented Role Switcher */}
      <div className="p-1.5 bg-soft-meadow rounded-2xl border border-deep-ink/10 flex gap-2">
        <button
          type="button"
          onClick={() => handleRoleChange('doctor')}
          className={cn(
            'flex-1 py-3 px-4 rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer select-none',
            userType === 'doctor'
              ? 'bg-white text-deep-ink font-semibold shadow-xs border border-deep-ink/10'
              : 'text-slate hover:text-deep-ink hover:bg-white/50'
          )}
        >
          <Stethoscope className={cn('w-4 h-4', userType === 'doctor' ? 'text-deep-ink' : 'text-slate')} />
          <span>Doctor / Provider</span>
        </button>

        <button
          type="button"
          onClick={() => handleRoleChange('patient')}
          className={cn(
            'flex-1 py-3 px-4 rounded-xl font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer select-none',
            userType === 'patient'
              ? 'bg-white text-deep-ink font-semibold shadow-xs border border-deep-ink/10'
              : 'text-slate hover:text-deep-ink hover:bg-white/50'
          )}
        >
          <User className={cn('w-4 h-4', userType === 'patient' ? 'text-deep-ink' : 'text-slate')} />
          <span>Patient Account</span>
        </button>
      </div>

      {/* 2. Heading */}
      <div>
        <h2 className="text-2xl font-bold font-serif mb-1 text-deep-ink">
          Create {userType === 'doctor' ? 'Physician' : 'Patient'} Account
        </h2>
        <p className="text-slate text-xs sm:text-sm">
          {userType === 'doctor'
            ? 'Register as a licensed medical practitioner to manage consultations and clinical records.'
            : 'Register to access your personal AI health intake and consultation portal.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 font-sans">
        {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-deep-ink">First Name</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              className="w-full px-3.5 py-2.5 border border-deep-ink/15 rounded-xl text-deep-ink placeholder:text-slate/50 focus:outline-none focus:border-deep-ink focus:ring-2 focus:ring-deep-ink/10 text-sm bg-white shadow-2xs transition-all"
              placeholder="First name"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-deep-ink">Last Name</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              className="w-full px-3.5 py-2.5 border border-deep-ink/15 rounded-xl text-deep-ink placeholder:text-slate/50 focus:outline-none focus:border-deep-ink focus:ring-2 focus:ring-deep-ink/10 text-sm bg-white shadow-2xs transition-all"
              placeholder="Last name"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-deep-ink">
            {userType === 'doctor' ? 'Clinical Email' : 'Email Address'}
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-3.5 py-2.5 border border-deep-ink/15 rounded-xl text-deep-ink placeholder:text-slate/50 focus:outline-none focus:border-deep-ink focus:ring-2 focus:ring-deep-ink/10 text-sm bg-white shadow-2xs transition-all"
            placeholder={userType === 'doctor' ? 'doctor@hospital.org' : 'you@example.com'}
          />
        </div>

        {userType === 'doctor' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-deep-ink">Medical Specialty</label>
              <input
                type="text"
                name="specialty"
                value={formData.specialty}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 border border-deep-ink/15 rounded-xl text-deep-ink placeholder:text-slate/50 focus:outline-none focus:border-deep-ink focus:ring-2 focus:ring-deep-ink/10 text-sm bg-white shadow-2xs transition-all"
                placeholder="e.g. Cardiology"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-deep-ink">Clinic / Hospital</label>
              <input
                type="text"
                name="clinic"
                value={formData.clinic}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 border border-deep-ink/15 rounded-xl text-deep-ink placeholder:text-slate/50 focus:outline-none focus:border-deep-ink focus:ring-2 focus:ring-deep-ink/10 text-sm bg-white shadow-2xs transition-all"
                placeholder="e.g. St. Jude Clinic"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-deep-ink">Date of Birth</label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              required
              className="w-full px-3.5 py-2.5 border border-deep-ink/15 rounded-xl text-deep-ink focus:outline-none focus:border-deep-ink focus:ring-2 focus:ring-deep-ink/10 text-sm bg-white shadow-2xs transition-all"
            />
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-deep-ink">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
            className="w-full px-3.5 py-2.5 border border-deep-ink/15 rounded-xl text-deep-ink placeholder:text-slate/50 focus:outline-none focus:border-deep-ink focus:ring-2 focus:ring-deep-ink/10 text-sm bg-white shadow-2xs transition-all"
            placeholder="At least 6 characters"
          />
        </div>

        {/* Primary Action Button */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-deep-ink text-white hover:bg-deep-ink/90 font-semibold py-3 h-11 text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Creating Account...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-white">
              <span>Register as {userType === 'doctor' ? 'Doctor' : 'Patient'}</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </div>
          )}
        </Button>
      </form>

      {/* Footer Link */}
      <div className="text-center text-xs text-slate pt-2 border-t border-deep-ink/10">
        Already have an account?{' '}
        <Link
          href={`/auth/login?type=${userType}`}
          className="font-semibold text-deep-ink hover:underline"
        >
          Sign in to your {userType === 'doctor' ? 'Doctor' : 'Patient'} account
        </Link>
      </div>
    </div>
  )
}
