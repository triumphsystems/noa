'use client'

import * as React from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Bell, LogOut } from 'lucide-react'

export default function PatientDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-canvas text-deep-ink flex flex-col">
      {/* Patient Portal Header */}
      <header className="border-b border-deep-ink/10 bg-soft-meadow sticky top-0 z-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <Link href="/dashboard/patient" className="flex items-center gap-2 hover:opacity-90 transition-opacity shrink-0">
              <img src="/logo.svg" alt="Noa Logo" className="w-8 h-8 rounded-lg shadow-2xs" />
              <span className="text-xl sm:text-2xl font-bold font-serif text-deep-ink">Noa</span>
            </Link>
            <Badge variant="secondary" className="text-[10px] sm:text-xs hidden sm:inline-flex shrink-0">
              Patient Portal
            </Badge>
          </div>
          <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
            <button
              className="p-1.5 sm:p-2 hover:bg-deep-ink/5 rounded-full text-deep-ink transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
            </button>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-hi-yellow border border-deep-ink/10 flex items-center justify-center font-serif font-bold text-deep-ink shadow-2xs text-xs sm:text-base">
              P
            </div>
            <Link
              href="/auth/logout"
              className="text-sm font-medium text-slate hover:text-deep-ink flex items-center gap-1.5 transition-colors p-1"
              aria-label="Log Out"
            >
              <LogOut className="w-4 h-4" />
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
