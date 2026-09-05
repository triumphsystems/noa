'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ErrorAlert } from '@/components/ui/error-alert';
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  const userType = searchParams.get('type') || 'doctor';

  const [formData, setFormData] = useState({
    email: initialEmail,
    code: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match. Please ensure both passwords match.');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim(),
          code: formData.code.trim(),
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to reset password.');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <div className="bg-hi-yellow/25 border-hi-yellow/60 text-deep-ink mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border shadow-2xs">
            <CheckCircle2 className="text-deep-ink h-6 w-6" />
          </div>
          <h2 className="text-deep-ink font-serif text-2xl font-bold">
            Password updated
          </h2>
          <p className="text-slate mx-auto max-w-sm text-sm leading-relaxed">
            Your password has been reset successfully. You can now log into your
            account with your new credentials.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <Link href={`/auth/login?type=${userType}`} className="block">
            <Button
              variant="dark"
              className="bg-deep-ink hover:bg-deep-ink/90 h-11 w-full rounded-lg py-2.5 font-medium text-white shadow-2xs"
            >
              Continue to Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/auth/forgot-password?email=${encodeURIComponent(formData.email)}&type=${userType}`}
          className="text-slate hover:text-deep-ink mb-4 inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Request a new code
        </Link>
        <h2 className="text-deep-ink mb-2 font-serif text-2xl font-bold">
          Set new password
        </h2>
        <p className="text-slate text-sm leading-relaxed">
          Enter the verification code sent to your email along with your desired
          new password.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 font-sans">
        {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}

        <div className="space-y-1.5">
          <label className="text-deep-ink block text-xs font-medium">
            Email address
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="border-deep-ink/15 text-deep-ink placeholder:text-slate/60 focus:border-deep-ink focus:ring-deep-ink/20 w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm shadow-2xs transition-colors focus:ring-1 focus:outline-none"
            placeholder="you@example.com"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-deep-ink block text-xs font-medium">
            Verification Code
          </label>
          <div className="relative">
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              required
              maxLength={8}
              className="border-deep-ink/15 text-deep-ink placeholder:text-slate/60 focus:border-deep-ink focus:ring-deep-ink/20 w-full rounded-lg border bg-white py-2.5 pr-3.5 pl-9 font-mono text-sm tracking-widest shadow-2xs transition-colors focus:ring-1 focus:outline-none"
              placeholder="123456"
            />
            <KeyRound className="text-slate/60 absolute top-3 left-3 h-4 w-4" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-deep-ink block text-xs font-medium">
            New Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              required
              minLength={6}
              className="border-deep-ink/15 text-deep-ink placeholder:text-slate/60 focus:border-deep-ink focus:ring-deep-ink/20 w-full rounded-lg border bg-white py-2.5 pr-10 pl-9 text-sm shadow-2xs transition-colors focus:ring-1 focus:outline-none"
              placeholder="••••••••"
            />
            <Lock className="text-slate/60 absolute top-3 left-3 h-4 w-4" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-slate/60 hover:text-deep-ink absolute top-3 right-3"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-deep-ink block text-xs font-medium">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength={6}
              className="border-deep-ink/15 text-deep-ink placeholder:text-slate/60 focus:border-deep-ink focus:ring-deep-ink/20 w-full rounded-lg border bg-white py-2.5 pr-3.5 pl-9 text-sm shadow-2xs transition-colors focus:ring-1 focus:outline-none"
              placeholder="••••••••"
            />
            <Lock className="text-slate/60 absolute top-3 left-3 h-4 w-4" />
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          variant="dark"
          className="bg-deep-ink hover:bg-deep-ink/90 h-11 w-full rounded-lg py-2.5 font-medium text-white shadow-2xs"
        >
          {loading ? 'Updating password...' : 'Reset Password'}
        </Button>
      </form>

      <div className="text-slate text-center text-xs">
        Back to{' '}
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
