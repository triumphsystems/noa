'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Mail, KeyRound, CheckCircle2, ShieldCheck } from 'lucide-react'

export default function ForgotPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialEmail = searchParams.get('email') || ''
  const userType = searchParams.get('type') || 'doctor'

  const [email, setEmail] = useState(initialEmail)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [deliveryDestination, setDeliveryDestination] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset code.')
      }

      setDeliveryDestination(data.destination || email)
      setSubmitted(true)
    } catch (err: any) {
      setError(err?.message || 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-hi-yellow/25 border border-hi-yellow/60 flex items-center justify-center mx-auto text-deep-ink shadow-2xs">
            <CheckCircle2 className="w-6 h-6 text-deep-ink" />
          </div>
          <h2 className="text-2xl font-bold font-serif text-deep-ink">Check your inbox</h2>
          <p className="text-slate text-sm leading-relaxed max-w-sm mx-auto">
            We sent a verification code to <span className="font-semibold text-deep-ink">{deliveryDestination}</span>.
          </p>
        </div>

        <div className="rounded-2xl border border-deep-ink/10 bg-soft-meadow/40 p-4 text-xs text-deep-ink space-y-2">
          <div className="flex items-center gap-1.5 font-semibold text-deep-ink">
            <ShieldCheck className="w-4 h-4 text-deep-ink" />
            <span>Next steps</span>
          </div>
          <p className="text-slate leading-relaxed">
            Enter the 6-digit confirmation code on the next page along with your new password to restore access to your account.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href={`/auth/reset-password?email=${encodeURIComponent(email)}&type=${userType}`}
            className="block"
          >
            <Button variant="dark" className="w-full rounded-lg font-medium py-2.5 h-11 shadow-2xs bg-deep-ink hover:bg-deep-ink/90 text-white">
              Enter Reset Code &amp; New Password
            </Button>
          </Link>

          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="w-full text-center text-xs font-medium text-slate hover:text-deep-ink transition-colors py-1 cursor-pointer"
          >
            Didn't receive a code? Try again
          </button>
        </div>

        <div className="pt-2 text-center">
          <Link
            href={`/auth/login?type=${userType}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate hover:text-deep-ink transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/auth/login?type=${userType}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate hover:text-deep-ink mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to login
        </Link>
        <h2 className="text-2xl font-bold font-serif mb-2 text-deep-ink">Reset your password</h2>
        <p className="text-slate text-sm leading-relaxed">
          Enter the email address associated with your Noa account and we will send you a verification code.
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
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-9 pr-3.5 py-2.5 border border-deep-ink/15 rounded-lg text-deep-ink placeholder:text-slate/60 focus:outline-none focus:border-deep-ink focus:ring-1 focus:ring-deep-ink/20 text-sm bg-white shadow-2xs transition-colors"
              placeholder="you@hospital.org"
            />
            <Mail className="w-4 h-4 text-slate/60 absolute left-3 top-3" />
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          variant="dark"
          className="w-full rounded-lg font-medium py-2.5 h-11 shadow-2xs bg-deep-ink hover:bg-deep-ink/90 text-white"
        >
          {loading ? 'Sending code...' : 'Send Verification Code'}
        </Button>
      </form>

      <div className="text-center text-xs text-slate">
        Remember your password?{' '}
        <Link href={`/auth/login?type=${userType}`} className="font-medium text-deep-ink hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  )
}
