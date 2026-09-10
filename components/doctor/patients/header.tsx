'use client';

import React from 'react';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PatientsHeaderProps {
  onAddPatient: () => void;
}

export function PatientsHeader({ onAddPatient }: PatientsHeaderProps) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h1 className="text-deep-ink mb-1 font-serif text-2xl font-bold sm:text-3xl">
          Patients
        </h1>
        <p className="text-slate text-xs sm:text-sm">
          Manage and review your patient registry
        </p>
      </div>
      <div className="flex items-center gap-2.5">
        <Button
          onClick={onAddPatient}
          className="bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 w-full cursor-pointer gap-2 rounded-full text-xs font-medium shadow-2xs sm:w-auto sm:text-sm"
        >
          <UserPlus className="h-4 w-4" />
          Add Patient
        </Button>
      </div>
    </div>
  );
}
