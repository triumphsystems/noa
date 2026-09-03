'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

type SignupFormProps = {
  userType: 'doctor' | 'patient'
}

export default function SignupForm({ userType }: SignupFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    specialty: '',
    clinic: '',
    dateOfBirth: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

      router.push(`/auth/verify?email=${encodeURIComponent(formData.email)}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-serif mb-2 text-deep-ink">Create your account</h2>
        <p className="text-slate text-sm">
          Sign up as a {userType === 'doctor' ? 'doctor' : 'patient'} to get started with Noa
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-deep-ink">First Name</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              className="w-full px-3.5 py-2 border border-deep-ink/15 rounded-lg text-deep-ink placeholder:text-slate/60 focus:outline-none focus:border-deep-ink focus:ring-1 focus:ring-deep-ink/20 text-sm bg-white shadow-2xs transition-colors"
              placeholder="First name"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-deep-ink">Last Name</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              className="w-full px-3.5 py-2 border border-deep-ink/15 rounded-lg text-deep-ink placeholder:text-slate/60 focus:outline-none focus:border-deep-ink focus:ring-1 focus:ring-deep-ink/20 text-sm bg-white shadow-2xs transition-colors"
              placeholder="Last name"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-deep-ink">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-3.5 py-2 border border-deep-ink/15 rounded-lg text-deep-ink placeholder:text-slate/60 focus:outline-none focus:border-deep-ink focus:ring-1 focus:ring-deep-ink/20 text-sm bg-white shadow-2xs transition-colors"
            placeholder="you@example.com"
          />
        </div>

        {userType === 'doctor' ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-deep-ink">Specialty</label>
              <select
                name="specialty"
                value={formData.specialty}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2 border border-deep-ink/15 rounded-lg text-deep-ink focus:outline-none focus:border-deep-ink focus:ring-1 focus:ring-deep-ink/20 text-sm bg-white shadow-2xs transition-colors cursor-pointer"
              >
                <option value="">Select specialty</option>
                <option value="General Practice">General Practice</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Dermatology">Dermatology</option>
                <option value="Neurology">Neurology</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Psychiatry">Psychiatry</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-deep-ink">Clinic Name</label>
              <input
                type="text"
                name="clinic"
                value={formData.clinic}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2 border border-deep-ink/15 rounded-lg text-deep-ink placeholder:text-slate/60 focus:outline-none focus:border-deep-ink focus:ring-1 focus:ring-deep-ink/20 text-sm bg-white shadow-2xs transition-colors"
                placeholder="Clinic name"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <label className="block text-xs font-medium text-deep-ink">Date of Birth</label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              required
              className="w-full px-3.5 py-2 border border-deep-ink/15 rounded-lg text-deep-ink focus:outline-none focus:border-deep-ink focus:ring-1 focus:ring-deep-ink/20 text-sm bg-white shadow-2xs transition-colors"
            />
          </div>
        )}

        <div className="space-y-1">
          <label className="block text-xs font-medium text-deep-ink">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full px-3.5 py-2 border border-deep-ink/15 rounded-lg text-deep-ink placeholder:text-slate/60 focus:outline-none focus:border-deep-ink focus:ring-1 focus:ring-deep-ink/20 text-sm bg-white shadow-2xs transition-colors"
            placeholder="••••••••"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          variant="dark"
          className="w-full rounded-lg font-medium py-2.5 h-10 shadow-2xs mt-2"
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>

      <div className="text-center text-xs text-slate">
        Already have an account?{' '}
        <Link href={`/auth/login?type=${userType}`} className="font-medium text-deep-ink hover:underline">
          Sign in
        </Link>
      </div>

      <div className="pt-4 border-t border-deep-ink/10">
        <div className="flex gap-1.5 p-1 bg-soft-meadow/80 rounded-xl border border-deep-ink/8 text-xs font-sans">
          <Link
            href="/auth/signup?type=doctor"
            className={`flex-1 text-center py-1.5 px-3 rounded-lg font-medium transition-all ${
              userType === 'doctor'
                ? 'bg-white text-deep-ink font-semibold shadow-2xs'
                : 'text-slate hover:text-deep-ink hover:bg-white/50'
            }`}
          >
            Doctor Signup
          </Link>
          <Link
            href="/auth/signup?type=patient"
            className={`flex-1 text-center py-1.5 px-3 rounded-lg font-medium transition-all ${
              userType === 'patient'
                ? 'bg-white text-deep-ink font-semibold shadow-2xs'
                : 'text-slate hover:text-deep-ink hover:bg-white/50'
            }`}
          >
            Patient Signup
          </Link>
        </div>
      </div>
    </div>
  )
}
