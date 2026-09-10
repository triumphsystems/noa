'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Patient } from '@/lib/db';

interface SessionHeaderProps {
  activePatient: Patient | null;
  activePatientName: string;
}

export function SessionHeader({
  activePatient,
  activePatientName,
}: SessionHeaderProps) {
  return (
    <div className="space-y-1.5">
      {/* Top Header & Breadcrumb */}
      <div className="text-slate mb-1 flex items-center gap-2 text-xs font-semibold">
        <Link
          href="/dashboard/doctor"
          className="hover:text-deep-ink flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Dashboard</span>
        </Link>
        <span>/</span>
        {activePatient ? (
          <Link
            href={`/dashboard/doctor/patients/${activePatient.id}`}
            className="hover:text-deep-ink max-w-xs truncate transition-colors"
          >
            {activePatientName}
          </Link>
        ) : (
          <span className="text-deep-ink">Consultation</span>
        )}
      </div>

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-deep-ink font-serif text-2xl font-bold sm:text-3xl">
            Clinical Voice Consultation
          </h1>
          <p className="text-slate text-xs sm:text-sm">
            Live doctor-patient encounter with ambient speech recognition,
            clinical guidance, and automated SOAP documentation
          </p>
        </div>

        {activePatient && (
          <div className="flex items-center gap-2">
            <Link href={`/dashboard/doctor/patients/${activePatient.id}`}>
              <Button
                variant="outline"
                size="sm"
                className="cursor-pointer gap-1.5 rounded-full text-xs font-medium"
              >
                <User className="h-3.5 w-3.5" />
                <span>View Patient Chart</span>
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
