'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { useDoctorDashboardStore } from '@/lib/stores/doctor-dashboard-store'
import { useSessionStore } from '@/lib/stores/session-store'

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    const keysToRemove = [
      'doctorId',
      'patientId',
      'userType',
      'accessToken',
      'idToken',
      'refreshToken',
    ]

    keysToRemove.forEach(key => window.localStorage.removeItem(key))

    useDoctorDashboardStore.getState().clearDashboard()
    useSessionStore.getState().resetSession()

    router.replace('/auth/login?type=doctor')
  }, [router])

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border border-deep-ink/10 bg-white p-8 text-center shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-hi-yellow font-semibold mb-3">
          Signing out
        </p>
        <h1 className="text-2xl font-bold font-serif mb-2">Logging you out</h1>
        <p className="text-sm text-slate">
          Clearing your session and returning you to the login screen.
        </p>
      </div>
    </div>
  )
}
