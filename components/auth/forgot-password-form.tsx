'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ErrorAlert } from '@/components/ui/error-alert';
import {
  ArrowLeft,
  Mail,
  KeyRound,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

export default function ForgotPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  const userType = searchParams.get('type') || 'doctor';

  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [deliveryDestination, setDeliveryDestination] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset code.');
      }

      setDeliveryDestination(data.destination || email);
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <div className="bg-hi-yellow/25 border-hi-yellow/60 text-deep-ink mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border shadow-2xs">
            <CheckCircle2 className="text-deep-ink h-6 w-6" />
          </div>
          <h2 className="text-deep-ink font-serif text-2xl font-bold">
            Check your inbox
          </h2>
          <p className="text-slate mx-auto max-w-sm text-sm leading-relaxed">
            We sent a verification code to{' '}
            <span className="text-deep-ink font-semibold">
              {deliveryDestination}
            </span>
            .
          </p>
        </div>

        <div className="border-deep-ink/10 bg-soft-meadow/40 text-deep-ink space-y-2 rounded-2xl border p-4 text-xs">
          <div className="text-deep-ink flex items-center gap-1.5 font-semibold">
            <ShieldCheck className="text-deep-ink h-4 w-4" />
            <span>Next steps</span>
          </div>
          <p className="text-slate leading-relaxed">
            Enter the 6-digit confirmation code on the next page along with your
            new password to restore access to your account.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href={`/auth/reset-password?email=${encodeURIComponent(email)}&type=${userType}`}
            className="block"
          >
            <Button
              variant="dark"
              className="bg-deep-ink hover:bg-deep-ink/90 h-11 w-full rounded-lg py-2.5 font-medium text-white shadow-2xs"
            >
              Enter Reset Code &amp; New Password
            </Button>
          </Link>

          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="text-slate hover:text-deep-ink w-full cursor-pointer py-1 text-center text-xs font-medium transition-colors"
          >
            Didn't receive a code? Try again
          </button>
        </div>

        <div className="pt-2 text-center">
          <Link
            href={`/auth/login?type=${userType}`}
            className="text-slate hover:text-deep-ink inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/auth/login?type=${userType}`}
          className="text-slate hover:text-deep-ink mb-4 inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to login
        </Link>
        <h2 className="text-deep-ink mb-2 font-serif text-2xl font-bold">
          Reset your password
        </h2>
        <p className="text-slate text-sm leading-relaxed">
          Enter the email address associated with your Noa account and we will
          send you a verification code.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 font-sans">
        {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}

        <div className="space-y-1.5">
          <label className="text-deep-ink block text-xs font-medium">
            Email address
          </label>
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border-deep-ink/15 text-deep-ink placeholder:text-slate/60 focus:border-deep-ink focus:ring-deep-ink/20 w-full rounded-lg border bg-white py-2.5 pr-3.5 pl-9 text-sm shadow-2xs transition-colors focus:ring-1 focus:outline-none"
              placeholder="you@hospital.org"
            />
            <Mail className="text-slate/60 absolute top-3 left-3 h-4 w-4" />
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          variant="dark"
          className="bg-deep-ink hover:bg-deep-ink/90 h-11 w-full rounded-lg py-2.5 font-medium text-white shadow-2xs"
        >
          {loading ? 'Sending code...' : 'Send Verification Code'}
        </Button>
      </form>

      <div className="text-slate text-center text-xs">
        Remember your password?{' '}
        <Link
          href={`/auth/login?type=${userType}`}
          className="text-deep-ink font-medium hover:underline"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}
