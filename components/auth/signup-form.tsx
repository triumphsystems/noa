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
          <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-deep-ink mb-1">First Name</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 border border-deep-ink/20 rounded-full text-deep-ink placeholder-slate focus:outline-none focus:ring-2 focus:ring-hi-yellow text-base sm:text-sm bg-transparent"
              placeholder="First name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-deep-ink mb-1">Last Name</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 border border-deep-ink/20 rounded-full text-deep-ink placeholder-slate focus:outline-none focus:ring-2 focus:ring-hi-yellow text-base sm:text-sm bg-transparent"
              placeholder="Last name"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-deep-ink mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 border border-deep-ink/20 rounded-full text-deep-ink placeholder-slate focus:outline-none focus:ring-2 focus:ring-hi-yellow text-sm bg-transparent"
            placeholder="you@example.com"
          />
        </div>

        {userType === 'doctor' ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-deep-ink mb-1">Specialty</label>
              <select
                name="specialty"
                value={formData.specialty}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-deep-ink/20 rounded-full text-deep-ink focus:outline-none focus:ring-2 focus:ring-hi-yellow text-sm bg-transparent"
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
            <div>
              <label className="block text-sm font-medium text-deep-ink mb-1">Clinic Name</label>
              <input
                type="text"
                name="clinic"
                value={formData.clinic}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-deep-ink/20 rounded-full text-deep-ink placeholder-slate focus:outline-none focus:ring-2 focus:ring-hi-yellow text-sm bg-transparent"
                placeholder="Clinic name"
              />
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-deep-ink mb-1">Date of Birth</label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 border border-deep-ink/20 rounded-full text-deep-ink focus:outline-none focus:ring-2 focus:ring-hi-yellow text-sm bg-transparent"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-deep-ink mb-1">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 border border-deep-ink/20 rounded-full text-deep-ink placeholder-slate focus:outline-none focus:ring-2 focus:ring-hi-yellow text-sm bg-transparent"
            placeholder="••••••••"
          />
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 font-medium py-5 shadow-xs"
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </Button>
      </form>

      <div className="text-center text-xs text-slate">
        Already have an account?{' '}
        <Link href="/auth/login" className="font-semibold text-deep-ink hover:underline">
          Log in
        </Link>
      </div>

      <div className="pt-4 border-t border-deep-ink/10 text-center text-xs text-slate">
        By creating an account, you agree to our{' '}
        <a href="#" className="font-medium text-deep-ink hover:underline">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="#" className="font-medium text-deep-ink hover:underline">
          Privacy Policy
        </a>
      </div>
    </div>
  )
}
