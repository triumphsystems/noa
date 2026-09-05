'use client';

import * as React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Bell, LogOut } from 'lucide-react';
import { usePatientStore } from '@/lib/stores/patient.store';

export default function PatientDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const patient = usePatientStore((state) => state.patient);
  const initial = patient?.firstName
    ? patient.firstName.charAt(0).toUpperCase()
    : 'P';

  return (
    <div className="bg-canvas text-deep-ink flex min-h-screen flex-col">
      {/* Patient Portal Header */}
      <header className="border-deep-ink/8 bg-canvas/90 sticky top-0 z-20 border-b font-sans backdrop-blur-md">
        <div className="flex w-full items-center justify-between gap-2 px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/dashboard/patient"
              className="flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-90"
            >
              <img
                src="/logo.svg"
                alt="Noa Logo"
                className="h-8 w-8 rounded-lg shadow-2xs"
              />
              <span className="text-deep-ink font-serif text-xl font-bold">
                Noa
              </span>
            </Link>
            <Badge
              variant="secondary"
              className="hidden shrink-0 text-[11px] sm:inline-flex"
            >
              Patient Portal
            </Badge>
          </div>
          <div className="flex shrink-0 items-center gap-2.5 sm:gap-4">
            <button
              className="hover:bg-soft-meadow text-slate hover:text-deep-ink cursor-pointer rounded-lg p-1.5 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
            </button>
            <div className="bg-hi-yellow border-deep-ink/10 text-deep-ink flex h-8 w-8 items-center justify-center rounded-lg border font-serif text-xs font-bold shadow-2xs">
              {initial}
            </div>
            <Link
              href="/auth/logout"
              className="text-slate hover:text-deep-ink flex items-center gap-1.5 p-1 text-xs font-medium transition-colors"
              aria-label="Log Out"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Log Out</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
