'use client';

import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Patient } from '@/lib/db';

interface PatientContextCardProps {
  patients: Patient[];
  selectedPatient: string;
  onSelectPatient: (patientId: string) => void;
  isRecording: boolean;
  activePatient: Patient | null;
}

export function PatientContextCard({
  patients,
  selectedPatient,
  onSelectPatient,
  isRecording,
  activePatient,
}: PatientContextCardProps) {
  return (
    <Card className="border-deep-ink/8 shadow-editorial border bg-white p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="flex-1 space-y-2">
          <label className="text-slate block text-xs font-bold tracking-wider uppercase">
            Selected Patient Record
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedPatient}
              onChange={(e) => onSelectPatient(e.target.value)}
              disabled={isRecording}
              className="border-deep-ink/15 text-deep-ink focus:ring-hi-yellow w-full cursor-pointer rounded-xl border bg-white px-3.5 py-2.5 text-xs shadow-2xs transition-colors focus:ring-2 focus:outline-none disabled:opacity-60 sm:w-80 sm:text-sm"
            >
              <option value="">Select a patient from your registry...</option>
              {patients.map((p) => {
                const pName =
                  [p.firstName, p.lastName].filter(Boolean).join(' ') ||
                  p.email ||
                  `Patient #${p.id.slice(-6)}`;
                return (
                  <option key={p.id} value={p.id}>
                    {pName} ({p.email || p.id.slice(0, 8)})
                  </option>
                );
              })}
            </select>

            {activePatient && (
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  ID: {activePatient.id.slice(0, 8)}...
                </Badge>
                {activePatient.linkStatus === 'pending_patient_approval' && (
                  <Badge
                    variant="secondary"
                    className="border-amber-200 bg-amber-50 text-xs text-amber-800"
                  >
                    Pending Consent
                  </Badge>
                )}
                {activePatient.linkStatus === 'linked' && (
                  <Badge variant="success" className="text-xs">
                    Practice Connected
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        {activePatient && (
          <div className="border-deep-ink/10 flex items-center gap-4 border-t pt-3 text-xs lg:border-t-0 lg:pt-0">
            <div>
              <span className="text-slate block text-[11px]">Date of Birth</span>
              <span className="text-deep-ink font-semibold">
                {activePatient.dateOfBirth || '—'}
              </span>
            </div>
            <div className="bg-deep-ink/10 hidden h-6 w-px sm:block" />
            <div>
              <span className="text-slate block text-[11px]">Gender</span>
              <span className="text-deep-ink font-semibold capitalize">
                {activePatient.gender || '—'}
              </span>
            </div>
            <div className="bg-deep-ink/10 hidden h-6 w-px sm:block" />
            <div>
              <span className="text-slate block text-[11px]">Conditions</span>
              <span className="text-deep-ink font-semibold">
                {activePatient.conditions?.length || 0} active
              </span>
            </div>
          </div>
        )}
      </div>

      {activePatient &&
      (activePatient.conditions?.length || activePatient.allergies?.length) ? (
        <div className="border-deep-ink/8 mt-4 grid grid-cols-1 gap-3 border-t pt-4 text-xs sm:grid-cols-2">
          {activePatient.conditions && activePatient.conditions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate font-medium">History:</span>
              {activePatient.conditions.map((cond, i) => (
                <span
                  key={i}
                  className="bg-soft-meadow text-deep-ink rounded-md px-2 py-0.5 text-[11px]"
                >
                  {cond}
                </span>
              ))}
            </div>
          )}
          {activePatient.allergies && activePatient.allergies.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 font-medium text-rose-700">
                <ShieldAlert className="h-3 w-3" /> Allergies:
              </span>
              {activePatient.allergies.map((allergy, i) => (
                <span
                  key={i}
                  className="rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] text-rose-700"
                >
                  {allergy}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </Card>
  );
}
