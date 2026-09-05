'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ErrorAlert } from '@/components/ui/error-alert';
import { Stethoscope, User, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type SignupFormProps = {
  userType: 'doctor' | 'patient';
};

export default function SignupForm({
  userType: initialUserType,
}: SignupFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userType, setUserType] = useState<'doctor' | 'patient'>(
    initialUserType
  );
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    specialty: '',
    clinic: '',
    license: '',
    issuingAuthority: '',
    dateOfBirth: '',
    doctorId: '',
  });

  useEffect(() => {
    setUserType(initialUserType);
  }, [initialUserType]);

  useEffect(() => {
    const urlDoctorId = searchParams.get('doctorId');
    if (urlDoctorId) {
      setFormData((prev) => ({ ...prev, doctorId: urlDoctorId }));
    }
  }, [searchParams]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRoleChange = (newRole: 'doctor' | 'patient') => {
    setUserType(newRole);
    setError('');
    const url = new URL(window.location.href);
    url.searchParams.set('type', newRole);
    window.history.replaceState({}, '', url.toString());
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          userType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }

      if (typeof window !== 'undefined') {
        if (data.doctor?.id) {
          window.localStorage.setItem('doctorId', data.doctor.id);
        }
        if (data.patient?.id) {
          window.localStorage.setItem('patientId', data.patient.id);
        }
        window.localStorage.setItem('userType', userType);
      }

      if (data.isConfirmed) {
        router.push(
          `/auth/login?verified=true&email=${encodeURIComponent(formData.email)}&type=${userType}`
        );
      } else {
        router.push(
          `/auth/login?registered=true&email=${encodeURIComponent(formData.email)}&type=${userType}`
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
      {/* 1. Top Segmented Role Switcher */}
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
          <span>Patient Account</span>
        </button>
      </div>

      {/* 2. Heading */}
      <div>
        <h2 className="text-deep-ink mb-1 font-serif text-2xl font-bold">
          Create {userType === 'doctor' ? 'Physician' : 'Patient'} Account
        </h2>
        <p className="text-slate text-xs sm:text-sm">
          {userType === 'doctor'
            ? 'Register as a licensed medical practitioner to manage consultations and clinical records.'
            : 'Register to access your personal AI health intake and consultation portal.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 font-sans">
        {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-deep-ink block text-xs font-semibold">
              First Name
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              className="border-deep-ink/15 text-deep-ink placeholder:text-slate/50 focus:border-deep-ink focus:ring-deep-ink/10 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm shadow-2xs transition-all focus:ring-2 focus:outline-none"
              placeholder="First name"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-deep-ink block text-xs font-semibold">
              Last Name
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              className="border-deep-ink/15 text-deep-ink placeholder:text-slate/50 focus:border-deep-ink focus:ring-deep-ink/10 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm shadow-2xs transition-all focus:ring-2 focus:outline-none"
              placeholder="Last name"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-deep-ink block text-xs font-semibold">
            {userType === 'doctor' ? 'Clinical Email' : 'Email Address'}
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

        {userType === 'doctor' ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-deep-ink block text-xs font-semibold">
                  Medical Specialty
                </label>
                <input
                  type="text"
                  name="specialty"
                  value={formData.specialty}
                  onChange={handleChange}
                  required
                  className="border-deep-ink/15 text-deep-ink placeholder:text-slate/50 focus:border-deep-ink focus:ring-deep-ink/10 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm shadow-2xs transition-all focus:ring-2 focus:outline-none"
                  placeholder="e.g. Cardiology"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-deep-ink block text-xs font-semibold">
                  Clinic / Hospital
                </label>
                <input
                  type="text"
                  name="clinic"
                  value={formData.clinic}
                  onChange={handleChange}
                  required
                  className="border-deep-ink/15 text-deep-ink placeholder:text-slate/50 focus:border-deep-ink focus:ring-deep-ink/10 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm shadow-2xs transition-all focus:ring-2 focus:outline-none"
                  placeholder="e.g. St. Jude Clinic"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-deep-ink block text-xs font-semibold">
                  Medical License Number{' '}
                  <span className="text-amber-600">*</span>
                </label>
                <input
                  type="text"
                  name="license"
                  value={formData.license || ''}
                  onChange={handleChange}
                  required
                  className="border-deep-ink/15 text-deep-ink placeholder:text-slate/50 focus:border-deep-ink focus:ring-deep-ink/10 w-full rounded-xl border bg-white px-3.5 py-2.5 font-mono text-sm shadow-2xs transition-all focus:ring-2 focus:outline-none"
                  placeholder="e.g. MD-982341"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-deep-ink block text-xs font-semibold">
                  Issuing Board / Authority
                </label>
                <input
                  type="text"
                  name="issuingAuthority"
                  value={formData.issuingAuthority || ''}
                  onChange={handleChange}
                  className="border-deep-ink/15 text-deep-ink placeholder:text-slate/50 focus:border-deep-ink focus:ring-deep-ink/10 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm shadow-2xs transition-all focus:ring-2 focus:outline-none"
                  placeholder="e.g. Medical Board / GMC"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className="text-deep-ink block text-xs font-semibold">
              Date of Birth
            </label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              required
              className="border-deep-ink/15 text-deep-ink focus:border-deep-ink focus:ring-deep-ink/10 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm shadow-2xs transition-all focus:ring-2 focus:outline-none"
            />
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-deep-ink block text-xs font-semibold">
            Password
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
            className="border-deep-ink/15 text-deep-ink placeholder:text-slate/50 focus:border-deep-ink focus:ring-deep-ink/10 w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm shadow-2xs transition-all focus:ring-2 focus:outline-none"
            placeholder="At least 6 characters"
          />
        </div>

        {/* Primary Action Button */}
        <Button
          type="submit"
          disabled={loading}
          className="bg-deep-ink hover:bg-deep-ink/90 mt-2 flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white shadow-md transition-all"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              <span>Creating Account...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-white">
              <span>
                Register as {userType === 'doctor' ? 'Doctor' : 'Patient'}
              </span>
              <ArrowRight className="h-4 w-4 text-white" />
            </div>
          )}
        </Button>
      </form>

      {/* Footer Link */}
      <div className="text-slate border-deep-ink/10 border-t pt-2 text-center text-xs">
        Already have an account?{' '}
        <Link
          href={`/auth/login?type=${userType}`}
          className="text-deep-ink font-semibold hover:underline"
        >
          Sign in to your {userType === 'doctor' ? 'Doctor' : 'Patient'} account
        </Link>
      </div>
    </div>
  );
}
