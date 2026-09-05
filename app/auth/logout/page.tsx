'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useDoctorStore } from '@/lib/stores/doctor.store';
import { useSessionStore } from '@/lib/stores/session.store';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    async function performLogout() {
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch (err) {
        console.error('Failed to clear remote auth session:', err);
      } finally {
        const keysToRemove = [
          'doctorId',
          'patientId',
          'userType',
          'accessToken',
          'idToken',
          'refreshToken',
        ];

        keysToRemove.forEach((key) => window.localStorage.removeItem(key));

        useDoctorStore.getState().clearDashboard();
        useSessionStore.getState().resetSession();

        router.replace('/auth/login?type=doctor');
      }
    }

    performLogout();
  }, [router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="border-deep-ink/10 w-full max-w-md space-y-3 rounded-3xl border bg-white p-8 text-center shadow-sm">
        <div className="border-deep-ink/20 border-t-deep-ink mb-1 inline-block h-8 w-8 animate-spin rounded-full border-2" />
        <h1 className="text-deep-ink font-serif text-2xl font-bold">
          Logging you out
        </h1>
        <p className="text-slate text-sm">
          Clearing your session and returning you to the login screen.
        </p>
      </div>
    </div>
  );
}
