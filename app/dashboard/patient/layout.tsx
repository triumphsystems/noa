'use client'

import * as React from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Bell, LogOut } from 'lucide-react'
import { usePatientStore } from '@/lib/stores/patient.store'

export default function PatientDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const patient = usePatientStore(state => state.patient)
  const initial = patient?.firstName ? patient.firstName.charAt(0).toUpperCase() : 'P'

  return (
    <div className="min-h-screen bg-canvas text-deep-ink flex flex-col">
      {/* Patient Portal Header */}
      <header className="border-b border-deep-ink/8 bg-canvas/90 backdrop-blur-md sticky top-0 z-20 font-sans">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-3.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/dashboard/patient" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity shrink-0">
              <img src="/logo.svg" alt="Noa Logo" className="w-8 h-8 rounded-lg shadow-2xs" />
              <span className="text-xl font-bold font-serif text-deep-ink">Noa</span>
            </Link>
            <Badge variant="secondary" className="hidden sm:inline-flex text-[11px] shrink-0">
              Patient Portal
            </Badge>
          </div>
          <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
            <button
              className="p-1.5 hover:bg-soft-meadow rounded-lg text-slate hover:text-deep-ink transition-colors cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-lg bg-hi-yellow border border-deep-ink/10 flex items-center justify-center font-serif font-bold text-deep-ink shadow-2xs text-xs">
              {initial}
            </div>
            <Link
              href="/auth/logout"
              className="text-xs font-medium text-slate hover:text-deep-ink flex items-center gap-1.5 transition-colors p-1"
              aria-label="Log Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Log Out</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
