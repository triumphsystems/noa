'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, LayoutDashboard, Menu, Mic, Users } from 'lucide-react';
import type { Doctor } from '@/lib/db/types';
import { cn } from '@/lib/utils';

interface DoctorBottomNavProps {
  doctor: Doctor | null;
  onOpenMenu: () => void;
}

export function DoctorBottomNav({ doctor, onOpenMenu }: DoctorBottomNavProps) {
  const pathname = usePathname();

  const isRestricted =
    Boolean(doctor?.verificationStatus) &&
    doctor?.verificationStatus !== 'verified';

  const isDashboardActive = pathname === '/dashboard/doctor';
  const isPatientsActive = pathname.startsWith('/dashboard/doctor/patients');
  const isSessionsActive = pathname.startsWith('/dashboard/doctor/sessions');
  const isSummariesActive = pathname.startsWith('/dashboard/doctor/summaries');
  const isMoreActive =
    pathname.startsWith('/dashboard/doctor/settings') ||
    pathname.startsWith('/dashboard/doctor/onboarding');

  return (
    <nav
      aria-label="Mobile Navigation"
      className="border-deep-ink/10 fixed right-0 bottom-0 left-0 z-40 border-t bg-white/95 backdrop-blur-md transition-all duration-200 md:hidden"
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.5rem)',
      }}
    >
      <div className="grid h-16 grid-cols-5 items-center px-1">
        {/* 1. Dashboard */}
        <Link
          href={
            isRestricted ? '/dashboard/doctor/onboarding' : '/dashboard/doctor'
          }
          className={cn(
            'flex flex-col items-center justify-center gap-1 py-1 transition-colors',
            isDashboardActive
              ? 'text-deep-ink font-semibold'
              : 'text-slate hover:text-deep-ink'
          )}
        >
          <div
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-full transition-colors',
              isDashboardActive && 'bg-soft-meadow text-deep-ink'
            )}
          >
            <LayoutDashboard className="h-4 w-4 shrink-0" />
          </div>
          <span className="text-[10px] tracking-tight">Dashboard</span>
        </Link>

        {/* 2. Patients */}
        <Link
          href={
            isRestricted
              ? '/dashboard/doctor/onboarding'
              : '/dashboard/doctor/patients'
          }
          className={cn(
            'flex flex-col items-center justify-center gap-1 py-1 transition-colors',
            isPatientsActive
              ? 'text-deep-ink font-semibold'
              : 'text-slate hover:text-deep-ink'
          )}
        >
          <div
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-full transition-colors',
              isPatientsActive && 'bg-soft-meadow text-deep-ink'
            )}
          >
            <Users className="h-4 w-4 shrink-0" />
          </div>
          <span className="text-[10px] tracking-tight">Patients</span>
        </Link>

        {/* 3. Center New Session Action */}
        <Link
          href={
            isRestricted
              ? '/dashboard/doctor/onboarding'
              : '/dashboard/doctor/sessions/new'
          }
          className="group relative -top-3 flex flex-col items-center justify-center"
          aria-label="Start New Clinical Session"
        >
          <div
            className={cn(
              'border-canvas flex h-12 w-12 items-center justify-center rounded-full border-4 shadow-md transition-all duration-200 active:scale-95',
              isSessionsActive
                ? 'bg-deep-ink text-canvas ring-2 ring-emerald-500/50'
                : 'bg-deep-ink text-canvas group-hover:scale-105'
            )}
          >
            <Mic className="h-5 w-5" />
          </div>
          <span
            className={cn(
              'mt-0.5 text-[10px] font-medium tracking-tight',
              isSessionsActive ? 'text-deep-ink font-semibold' : 'text-slate'
            )}
          >
            Session
          </span>
        </Link>

        {/* 4. Summaries */}
        <Link
          href={
            isRestricted
              ? '/dashboard/doctor/onboarding'
              : '/dashboard/doctor/summaries'
          }
          className={cn(
            'flex flex-col items-center justify-center gap-1 py-1 transition-colors',
            isSummariesActive
              ? 'text-deep-ink font-semibold'
              : 'text-slate hover:text-deep-ink'
          )}
        >
          <div
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-full transition-colors',
              isSummariesActive && 'bg-soft-meadow text-deep-ink'
            )}
          >
            <FileText className="h-4 w-4 shrink-0" />
          </div>
          <span className="text-[10px] tracking-tight">Summaries</span>
        </Link>

        {/* 5. More / Menu */}
        <button
          type="button"
          onClick={onOpenMenu}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-1 py-1 transition-colors',
            isMoreActive
              ? 'text-deep-ink font-semibold'
              : 'text-slate hover:text-deep-ink'
          )}
          aria-label="More navigation options"
        >
          <div
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-full transition-colors',
              isMoreActive && 'bg-soft-meadow text-deep-ink'
            )}
          >
            <Menu className="h-4 w-4 shrink-0" />
          </div>
          <span className="text-[10px] tracking-tight">More</span>
        </button>
      </div>
    </nav>
  );
}
