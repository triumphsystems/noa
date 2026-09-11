'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronRight,
  Menu,
  Plus,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Doctor } from '@/lib/db/types';
import { cn } from '@/lib/utils';

interface TopBarProps {
  doctor: Doctor | null;
  onOpenMobileMenu: () => void;
}

interface BreadcrumbConfig {
  trail: string[];
  title: string;
}

function getRouteBreadcrumb(pathname: string): BreadcrumbConfig {
  if (pathname === '/dashboard/doctor') {
    return { trail: ['Practice'], title: 'Overview' };
  }
  if (pathname === '/dashboard/doctor/sessions/new') {
    return { trail: ['Consultations'], title: 'New AI Session' };
  }
  if (pathname.startsWith('/dashboard/doctor/sessions/')) {
    return { trail: ['Consultations'], title: 'Session Record' };
  }
  if (pathname === '/dashboard/doctor/patients') {
    return { trail: ['Clinical Registry'], title: 'Patients' };
  }
  if (pathname.startsWith('/dashboard/doctor/patients/')) {
    return { trail: ['Patients'], title: 'Patient Dossier' };
  }
  if (pathname === '/dashboard/doctor/summaries') {
    return { trail: ['Clinical Intelligence'], title: 'SOAP Summaries' };
  }
  if (pathname.startsWith('/dashboard/doctor/summaries/')) {
    return { trail: ['Summaries'], title: 'Clinical Summary' };
  }
  if (pathname.startsWith('/dashboard/doctor/onboarding')) {
    return { trail: ['Compliance'], title: 'Licensure & Credentials' };
  }
  if (pathname.startsWith('/dashboard/doctor/settings')) {
    return { trail: ['Account'], title: 'Practice Settings' };
  }
  return { trail: ['Clinical Console'], title: 'Dashboard' };
}

export function DoctorTopBar({ doctor, onOpenMobileMenu }: TopBarProps) {
  const pathname = usePathname();
  const { trail, title } = useMemo(
    () => getRouteBreadcrumb(pathname),
    [pathname]
  );

  const doctorInitial = useMemo(() => {
    const source = doctor?.name?.trim() || 'Doctor';
    return source.charAt(0).toUpperCase();
  }, [doctor?.name]);

  const practiceContext = useMemo(() => {
    if (doctor?.clinic && doctor?.specialty) {
      return `${doctor.specialty} · ${doctor.clinic}`;
    }
    return doctor?.clinic || doctor?.specialty || 'Clinical Practice';
  }, [doctor?.clinic, doctor?.specialty]);

  return (
    <header className="border-deep-ink/10 sticky top-0 z-20 shrink-0 border-b bg-white">
      <div className="flex h-14 items-center justify-between gap-4 px-4 sm:h-16 sm:px-6 lg:px-8">
        {/* Mobile View Header (< md) */}
        <div className="flex min-w-0 items-center gap-2.5 md:hidden">
          <button
            onClick={onOpenMobileMenu}
            className="hover:bg-soft-meadow text-deep-ink -ml-1 rounded-full p-2 transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <img
            src="/logo.svg"
            alt="Noa Logo"
            className="h-6 w-6 shrink-0 rounded-md shadow-2xs"
          />
          <span className="truncate font-serif text-base font-semibold">
            {title}
          </span>
        </div>

        {/* Desktop View Left: Breadcrumbs + Practice Pill (>= md) */}
        <div className="hidden min-w-0 items-center gap-3 md:flex">
          <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-xs">
            <span className="text-slate/70 font-medium">Noa</span>
            {trail.map((item, idx) => (
              <React.Fragment key={idx}>
                <ChevronRight className="text-slate/40 h-3.5 w-3.5 shrink-0" />
                <span className="text-slate font-medium">{item}</span>
              </React.Fragment>
            ))}
            <ChevronRight className="text-slate/40 h-3.5 w-3.5 shrink-0" />
            <span className="text-deep-ink font-semibold">{title}</span>
          </nav>

          <span className="bg-deep-ink/15 hidden h-3.5 w-px xl:block" />

          {/* Practice Badge */}
          <div className="border-deep-ink/8 bg-soft-meadow/50 text-slate hidden items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium xl:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="max-w-[200px] truncate">{practiceContext}</span>
          </div>
        </div>

        {/* Desktop Center: Quick Patient Search Trigger (>= xl) */}
        <div className="hidden flex-1 justify-center px-4 xl:flex">
          <Link
            href="/dashboard/doctor/patients"
            className="border-deep-ink/10 bg-canvas/70 hover:bg-soft-meadow/40 text-slate hover:text-deep-ink flex w-full max-w-xs items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs shadow-2xs transition-colors"
          >
            <Search className="text-slate/70 h-3.5 w-3.5 shrink-0" />
            <span className="flex-1 text-left">Search patients or charts...</span>
            <kbd className="border-deep-ink/10 text-slate/70 rounded border bg-white px-1.5 py-0.5 font-mono text-[10px]">
              ⌘K
            </kbd>
          </Link>
        </div>

        {/* Right Side: Verification pill, New session CTA, Avatar */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {/* New Session Shortcut on Desktop */}
          <Link
            href="/dashboard/doctor/sessions/new"
            className="hidden sm:inline-flex"
          >
            <Button
              size="sm"
              className="h-8 gap-1.5 rounded-lg px-3 text-xs font-semibold shadow-2xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Session</span>
            </Button>
          </Link>

          {/* Verification Badge */}
          {doctor?.verificationStatus &&
            doctor.verificationStatus !== 'verified' && (
              <Link href="/dashboard/doctor/onboarding">
                <span
                  className={cn(
                    'flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors',
                    doctor.verificationStatus === 'pending'
                      ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                      : 'border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100'
                  )}
                >
                  <span
                    className={cn(
                      'h-2 w-2 rounded-full',
                      doctor.verificationStatus === 'pending'
                        ? 'animate-pulse bg-amber-500'
                        : 'bg-rose-500'
                    )}
                  />
                  <span className="hidden sm:inline">
                    {doctor.verificationStatus === 'pending'
                      ? 'Verification Pending'
                      : 'Action Required'}
                  </span>
                  <span className="sm:hidden">
                    {doctor.verificationStatus === 'pending' ? 'Pending' : 'Alert'}
                  </span>
                </span>
              </Link>
            )}

          {/* Avatar / Profile */}
          <Link
            href="/dashboard/doctor/settings"
            className="border-deep-ink/15 hover:ring-deep-ink/20 flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border shadow-2xs transition-all hover:ring-2 sm:h-9 sm:w-9"
            title={doctor?.name || 'Doctor Settings'}
          >
            {doctor?.avatar ? (
              <img
                src={doctor.avatar}
                alt={doctor.name || 'Doctor'}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="bg-soft-meadow text-deep-ink flex h-full w-full items-center justify-center font-serif text-xs font-bold sm:text-sm">
                {doctorInitial}
              </div>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
