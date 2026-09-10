'use client';

import React from 'react';
import Link from 'next/link';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DoctorHeaderProps {
  doctorName?: string;
  specialty?: string;
  clinic?: string;
  onRefresh: () => void;
}

export function DoctorHeader({
  doctorName,
  specialty,
  clinic,
  onRefresh,
}: DoctorHeaderProps) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 className="text-deep-ink mb-1 font-serif text-2xl font-bold sm:text-3xl">
          {doctorName || 'Doctor Dashboard'}
        </h1>
        <p className="text-slate text-xs sm:text-sm">
          {specialty && clinic
            ? `${specialty} · ${clinic}`
            : 'Welcome back to your practice'}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2.5 sm:flex-nowrap sm:gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          className="gap-2 rounded-lg text-xs font-medium"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh</span>
        </Button>
        <Link
          href="/dashboard/doctor/settings"
          className="flex-1 sm:flex-initial"
        >
          <Button
            size="sm"
            className="w-full rounded-lg text-xs font-semibold sm:w-auto"
          >
            Edit Profile
          </Button>
        </Link>
      </div>
    </div>
  );
}
