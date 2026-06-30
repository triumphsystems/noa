'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Lock, Mail, Eye, EyeOff } from 'lucide-react'

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
  const [showPassword, setShowPassword] = useState(false)

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
          window.localStorage.setItem('doctorId', data.user.id)
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
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold font-serif">Welcome back</h2>
        <p className="text-slate text-sm">
          Sign in as a {userType === 'doctor' ? 'doctor' : 'patient'} to access Noa
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700 flex items-start gap-3">
            <span className="mt-0.5">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-deep-ink">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate pointer-events-none" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full pl-12 pr-4 py-3 border border-deep-ink/15 rounded-lg text-deep-ink placeholder-slate focus:outline-none focus:ring-2 focus:ring-hi-yellow focus:border-transparent transition-all duration-200"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-deep-ink">Password</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate pointer-events-none" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full pl-12 pr-12 py-3 border border-deep-ink/15 rounded-lg text-deep-ink placeholder-slate focus:outline-none focus:ring-2 focus:ring-hi-yellow focus:border-transparent transition-all duration-200"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate hover:text-deep-ink transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm pt-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="rounded w-4 h-4" />
            <span className="text-slate">Remember me</span>
          </label>
          <a href="#" className="text-hi-yellow font-medium hover:text-hi-yellow/80 transition-colors">
            Forgot password?
          </a>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 font-semibold py-3 shadow-md hover:shadow-lg transition-all duration-200"
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <div className="text-center text-sm">
        Don't have an account?{' '}
        <Link href={`/auth/signup?type=${userType}`} className="font-medium text-hi-yellow hover:underline">
          Sign up
        </Link>
      </div>

      <div className="pt-6 border-t border-deep-ink/10">
        <p className="text-xs uppercase tracking-wider text-slate font-semibold mb-3">Account Type</p>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/auth/login?type=doctor" className="block">
            <button className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 ${userType === 'doctor' ? 'bg-hi-yellow text-deep-ink shadow-md' : 'bg-soft-meadow/50 text-deep-ink hover:bg-soft-meadow/70 border border-deep-ink/10'}`}>
              👨‍⚕️ Doctor
            </button>
          </Link>
          <Link href="/auth/login?type=patient" className="block">
            <button className={`w-full py-3 rounded-lg font-semibold transition-all duration-200 ${userType === 'patient' ? 'bg-hi-yellow text-deep-ink shadow-md' : 'bg-soft-meadow/50 text-deep-ink hover:bg-soft-meadow/70 border border-deep-ink/10'}`}>
              👤 Patient
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
