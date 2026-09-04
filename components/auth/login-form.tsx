'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ErrorAlert } from '@/components/ui/error-alert'
import { cn } from '@/lib/utils'

type LoginFormProps = {
  userType: 'doctor' | 'patient'
}

export default function LoginForm({ userType }: LoginFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(false)

  useEffect(() => {
    if (searchParams?.get('expired') === '1') {
      setSessionExpiredNotice(true)
    }
  }, [searchParams])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userType,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Login failed')
      }

      if (typeof window !== 'undefined') {
        if (data.user?.id) {
          if (userType === 'doctor') {
            window.localStorage.setItem('doctorId', data.user.id)
          } else {
            window.localStorage.setItem('patientId', data.user.id)
          }
        }
        window.localStorage.setItem('userType', userType)
      }

      router.push(userType === 'doctor' ? '/dashboard/doctor' : '/dashboard/patient')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold font-serif mb-2 text-deep-ink">Welcome back</h2>
        <p className="text-slate text-sm">
          Sign in as a {userType === 'doctor' ? 'doctor' : 'patient'} to access Noa
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 font-sans">
        {sessionExpiredNotice && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between">
            <span>Your session has expired. Please sign in again to continue.</span>
            <button
              type="button"
              onClick={() => setSessionExpiredNotice(false)}
              className="text-amber-700 hover:text-amber-900 font-bold ml-2"
            >
              ×
            </button>
          </div>
        )}
        {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}

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

        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded border-deep-ink/20 text-deep-ink focus:ring-deep-ink" />
            <span className="text-slate">Remember me</span>
          </label>
          <Link
            href={`/auth/forgot-password?email=${encodeURIComponent(formData.email)}&type=${userType}`}
            className="font-medium text-slate hover:text-deep-ink underline-offset-4 hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          disabled={loading}
          variant="dark"
          className="w-full rounded-lg font-medium py-2.5 h-10 shadow-2xs"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <div className="text-center text-xs text-slate">
        Don't have an account?{' '}
        <Link href={`/auth/signup?type=${userType}`} className="font-medium text-deep-ink hover:underline">
          Sign up
        </Link>
      </div>

      <div className="pt-4 border-t border-deep-ink/10">
        <div className="flex gap-1.5 p-1 bg-soft-meadow/80 rounded-xl border border-deep-ink/8 text-xs font-sans">
          <Link
            href="/auth/login?type=doctor"
            className={cn(
              'flex-1 text-center py-1.5 px-3 rounded-lg font-medium transition-all',
              userType === 'doctor'
                ? 'bg-white text-deep-ink font-semibold shadow-2xs'
                : 'text-slate hover:text-deep-ink hover:bg-white/50'
            )}
          >
            Doctor Sign In
          </Link>
          <Link
            href="/auth/login?type=patient"
            className={cn(
              'flex-1 text-center py-1.5 px-3 rounded-lg font-medium transition-all',
              userType === 'patient'
                ? 'bg-white text-deep-ink font-semibold shadow-2xs'
                : 'text-slate hover:text-deep-ink hover:bg-white/50'
            )}
          >
            Patient Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
