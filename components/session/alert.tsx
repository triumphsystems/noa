'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Patient } from '@/lib/db';

interface SessionSuccessAlertProps {
  activePatient: Patient | null;
  activePatientName: string;
  onReset: () => void;
}

export function SessionSuccessAlert({
  activePatient,
  activePatientName,
  onReset,
}: SessionSuccessAlertProps) {
  return (
    <div className="animate-in fade-in flex flex-col justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 sm:flex-row sm:items-center">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
        <div>
          <p className="text-xs font-semibold sm:text-sm">
            Consultation Record Saved Successfully!
          </p>
          <p className="text-xs text-emerald-800">
            The SOAP note and dialogue transcript have been archived to{' '}
            {activePatientName}&apos;s clinical chart.
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button
          onClick={onReset}
          size="sm"
          className="cursor-pointer rounded-full bg-emerald-600 text-xs text-white hover:bg-emerald-700"
        >
          Start Another Session
        </Button>
        {activePatient && (
          <Link href={`/dashboard/doctor/patients/${activePatient.id}`}>
            <Button
              variant="outline"
              size="sm"
              className="cursor-pointer rounded-full border-emerald-300 text-xs"
            >
              Open Patient Profile
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
