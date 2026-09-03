'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type LoginFormProps = {
  userType: 'doctor' | 'patient'
}

export default function LoginForm({ userType }: LoginFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-deep-ink mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 border border-deep-ink/20 rounded-full text-deep-ink placeholder-slate focus:outline-none focus:ring-2 focus:ring-hi-yellow text-base sm:text-sm bg-transparent"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-deep-ink mb-1">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 border border-deep-ink/20 rounded-full text-deep-ink placeholder-slate focus:outline-none focus:ring-2 focus:ring-hi-yellow text-base sm:text-sm bg-transparent"
            placeholder="••••••••"
          />
        </div>

        <div className="flex items-center justify-between text-xs">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded text-deep-ink focus:ring-hi-yellow" />
            <span className="text-slate">Remember me</span>
          </label>
          <a href="#" className="font-medium text-deep-ink hover:underline">
            Forgot password?
          </a>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 font-medium py-5 shadow-xs"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <div className="text-center text-xs text-slate">
        Don't have an account?{' '}
        <Link href={`/auth/signup?type=${userType}`} className="font-semibold text-deep-ink hover:underline">
          Sign up
        </Link>
      </div>

      <div className="pt-4 border-t border-deep-ink/10">
        <div className="flex gap-2 text-xs">
          <Link
            href="/auth/login?type=doctor"
            className={cn(
              'flex-1 text-center py-2 px-3 rounded-full font-medium transition-colors',
              userType === 'doctor'
                ? 'bg-hi-yellow text-deep-ink shadow-2xs'
                : 'bg-soft-meadow text-deep-ink/80 hover:bg-soft-meadow/80'
            )}
          >
            Doctor Sign In
          </Link>
          <Link
            href="/auth/login?type=patient"
            className={cn(
              'flex-1 text-center py-2 px-3 rounded-full font-medium transition-colors',
              userType === 'patient'
                ? 'bg-hi-yellow text-deep-ink shadow-2xs'
                : 'bg-soft-meadow text-deep-ink/80 hover:bg-soft-meadow/80'
            )}
          >
            Patient Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
