'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle2, KeyRound, Lock, Eye, EyeOff } from 'lucide-react'

export default function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialEmail = searchParams.get('email') || ''
  const userType = searchParams.get('type') || 'doctor'

  const [formData, setFormData] = useState({
    email: initialEmail,
    code: '',
    newPassword: '',
    confirmPassword: '',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match. Please ensure both passwords match.')
      return
    }

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim(),
          code: formData.code.trim(),
          newPassword: formData.newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password.')
      }

      setSuccess(true)
    } catch (err: any) {
      setError(err?.message || 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-hi-yellow/25 border border-hi-yellow/60 flex items-center justify-center mx-auto text-deep-ink shadow-2xs">
            <CheckCircle2 className="w-6 h-6 text-deep-ink" />
          </div>
          <h2 className="text-2xl font-bold font-serif text-deep-ink">Password updated</h2>
          <p className="text-slate text-sm leading-relaxed max-w-sm mx-auto">
            Your password has been reset successfully. You can now log into your account with your new credentials.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <Link href={`/auth/login?type=${userType}`} className="block">
            <Button variant="dark" className="w-full rounded-lg font-medium py-2.5 h-11 shadow-2xs bg-deep-ink hover:bg-deep-ink/90 text-white">
              Continue to Sign In
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/auth/forgot-password?email=${encodeURIComponent(formData.email)}&type=${userType}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate hover:text-deep-ink mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Request a new code
        </Link>
        <h2 className="text-2xl font-bold font-serif mb-2 text-deep-ink">Set new password</h2>
        <p className="text-slate text-sm leading-relaxed">
          Enter the verification code sent to your email along with your desired new password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 font-sans">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-deep-ink">Email address</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-3.5 py-2.5 border border-deep-ink/15 rounded-lg text-deep-ink placeholder:text-slate/60 focus:outline-none focus:border-deep-ink focus:ring-1 focus:ring-deep-ink/20 text-sm bg-white shadow-2xs transition-colors"
            placeholder="you@example.com"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-deep-ink">Verification Code</label>
          <div className="relative">
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              required
              maxLength={8}
              className="w-full pl-9 pr-3.5 py-2.5 border border-deep-ink/15 rounded-lg text-deep-ink placeholder:text-slate/60 focus:outline-none focus:border-deep-ink focus:ring-1 focus:ring-deep-ink/20 text-sm bg-white shadow-2xs tracking-widest font-mono transition-colors"
              placeholder="123456"
            />
            <KeyRound className="w-4 h-4 text-slate/60 absolute left-3 top-3" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-deep-ink">New Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full pl-9 pr-10 py-2.5 border border-deep-ink/15 rounded-lg text-deep-ink placeholder:text-slate/60 focus:outline-none focus:border-deep-ink focus:ring-1 focus:ring-deep-ink/20 text-sm bg-white shadow-2xs transition-colors"
              placeholder="••••••••"
            />
            <Lock className="w-4 h-4 text-slate/60 absolute left-3 top-3" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-slate/60 hover:text-deep-ink"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-deep-ink">Confirm New Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full pl-9 pr-3.5 py-2.5 border border-deep-ink/15 rounded-lg text-deep-ink placeholder:text-slate/60 focus:outline-none focus:border-deep-ink focus:ring-1 focus:ring-deep-ink/20 text-sm bg-white shadow-2xs transition-colors"
              placeholder="••••••••"
            />
            <Lock className="w-4 h-4 text-slate/60 absolute left-3 top-3" />
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          variant="dark"
          className="w-full rounded-lg font-medium py-2.5 h-11 shadow-2xs bg-deep-ink hover:bg-deep-ink/90 text-white"
        >
          {loading ? 'Updating password...' : 'Reset Password'}
        </Button>
      </form>

      <div className="text-center text-xs text-slate">
        Back to{' '}
        <Link href={`/auth/login?type=${userType}`} className="font-medium text-deep-ink hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  )
}
