'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ErrorAlert } from '@/components/ui/error-alert';
import {
  Stethoscope,
  User,
  ArrowRight,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type LoginFormProps = {
  userType: 'doctor' | 'patient';
};

export default function LoginForm({
  userType: initialUserType,
}: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userType, setUserType] = useState<'doctor' | 'patient'>(
    initialUserType
  );
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(false);

  // Sync state if URL prop changes
  useEffect(() => {
    setUserType(initialUserType);
  }, [initialUserType]);

  useEffect(() => {
    if (searchParams?.get('expired') === '1') {
      setSessionExpiredNotice(true);
    }
  }, [searchParams]);

  const handleRoleChange = (newRole: 'doctor' | 'patient') => {
    setUserType(newRole);
    setError('');
    // Update URL shallowly so bookmark/share preserves choice
    const url = new URL(window.location.href);
    url.searchParams.set('type', newRole);
    window.history.replaceState({}, '', url.toString());
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      const actualUserType = data.user?.userType || userType;

      if (typeof window !== 'undefined') {
        if (data.user?.id) {
          if (actualUserType === 'doctor') {
            window.localStorage.setItem('doctorId', data.user.id);
          } else if (actualUserType === 'admin') {
            window.localStorage.setItem('adminId', data.user.id);
          } else {
            window.localStorage.setItem('patientId', data.user.id);
          }
        }
        window.localStorage.setItem('userType', actualUserType);
      }

      const returnUrl = searchParams?.get('from');
      if (returnUrl && returnUrl.startsWith('/')) {
        router.push(returnUrl);
      } else if (actualUserType === 'admin') {
        router.push('/dashboard/admin');
      } else {
        router.push(
          actualUserType === 'doctor'
            ? '/dashboard/doctor'
            : '/dashboard/patient'
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Intuitive Top Segmented Role Switcher */}
      <div className="bg-soft-meadow border-deep-ink/10 flex gap-2 rounded-2xl border p-1.5">
        <button
          type="button"
          onClick={() => handleRoleChange('doctor')}
          className={cn(
            'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-medium transition-all select-none sm:text-sm',
            userType === 'doctor'
              ? 'text-deep-ink border-deep-ink/10 border bg-white font-semibold shadow-xs'
              : 'text-slate hover:text-deep-ink hover:bg-white/50'
          )}
        >
          <Stethoscope
            className={cn(
              'h-4 w-4',
              userType === 'doctor' ? 'text-deep-ink' : 'text-slate'
            )}
          />
          <span>Doctor / Provider</span>
        </button>

        <button
          type="button"
          onClick={() => handleRoleChange('patient')}
          className={cn(
            'flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-medium transition-all select-none sm:text-sm',
            userType === 'patient'
              ? 'text-deep-ink border-deep-ink/10 border bg-white font-semibold shadow-xs'
              : 'text-slate hover:text-deep-ink hover:bg-white/50'
          )}
        >
          <User
            className={cn(
              'h-4 w-4',
              userType === 'patient' ? 'text-deep-ink' : 'text-slate'
            )}
          />
          <span>Patient Portal</span>
        </button>
      </div>

      {/* 2. Clear Context Heading */}
      <div>
        <h2 className="text-deep-ink mb-1 font-serif text-2xl font-bold">
          Sign In as {userType === 'doctor' ? 'Physician' : 'Patient'}
        </h2>
        <p className="text-slate text-xs sm:text-sm">
          {userType === 'doctor'
            ? 'Access clinical consultations, SOAP summaries, and patient registry.'
            : 'Access your health records, consultation notes, and intake history.'}
        </p>
      </div>

      {/* 3. Form */}
      <form onSubmit={handleSubmit} className="space-y-4 font-sans">
        {sessionExpiredNotice && (
          <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-900">
            <span>
              Your session has expired. Please sign in again to continue.
            </span>
            <button
              type="button"
              onClick={() => setSessionExpiredNotice(false)}
              className="ml-2 cursor-pointer font-bold text-amber-700 hover:text-amber-900"
            >
              ×
            </button>
          </div>
        )}

        {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}

        <div className="space-y-1.5">
          <label className="text-deep-ink block text-xs font-semibold">
            {userType === 'doctor' ? 'Clinical Email' : 'Patient Email'}
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="border-deep-ink/15 text-deep-ink placeholder:text-slate/50 focus:border-deep-ink focus:ring-deep-ink/10 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm shadow-2xs transition-all focus:ring-2 focus:outline-none"
            placeholder={
              userType === 'doctor' ? 'doctor@hospital.org' : 'you@example.com'
            }
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-deep-ink block text-xs font-semibold">
              Password
            </label>
            <Link
              href={`/auth/forgot-password?email=${encodeURIComponent(formData.email)}&type=${userType}`}
              className="text-slate hover:text-deep-ink text-xs font-medium transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="border-deep-ink/15 text-deep-ink placeholder:text-slate/50 focus:border-deep-ink focus:ring-deep-ink/10 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm shadow-2xs transition-all focus:ring-2 focus:outline-none"
            placeholder="••••••••"
          />
        </div>

        <div className="flex items-center pt-1 text-xs">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              className="border-deep-ink/20 text-deep-ink focus:ring-deep-ink cursor-pointer rounded"
            />
            <span className="text-slate select-none">Remember this device</span>
          </label>
        </div>

        {/* Primary Submit Button with High Contrast & Clear Text */}
        <Button
          type="submit"
          disabled={loading}
          className="bg-deep-ink hover:bg-deep-ink/90 flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white shadow-md transition-all"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              <span>Authenticating...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-white">
              <span>
                Sign In to{' '}
                {userType === 'doctor' ? 'Doctor Portal' : 'Patient Portal'}
              </span>
              <ArrowRight className="h-4 w-4 text-white" />
            </div>
          )}
        </Button>
      </form>

      {/* 4. Footer Link */}
      <div className="text-slate border-deep-ink/10 border-t pt-2 text-center text-xs">
        Don't have an account?{' '}
        <Link
          href={`/auth/signup?type=${userType}`}
          className="text-deep-ink font-semibold hover:underline"
        >
          Register as {userType === 'doctor' ? 'Doctor' : 'Patient'}
        </Link>
      </div>
    </div>
  );
}
