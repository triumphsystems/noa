'use client';

import React, { useState } from 'react';
import { ShieldCheck, Mail, Check, Copy } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DoctorConnectCard } from './doctor-connect-card';
import type { Doctor } from '@/lib/db';
import type { PatientProfile } from '@/lib/types/patient.types';

interface PatientCareProps {
  hasDoctor: boolean;
  doctor: Doctor | null;
  pendingDoctor: Doctor | null;
  patient: PatientProfile | null;
  patientId: string | null;
  isPendingApproval: boolean;
  onRefresh: () => Promise<void>;
}

export function PatientCare({
  hasDoctor,
  doctor,
  pendingDoctor,
  patient,
  patientId,
  isPendingApproval,
  onRefresh,
}: PatientCareProps) {
  const [isChangingDoctor, setIsChangingDoctor] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopy = (text: string) => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="animate-in fade-in space-y-4 duration-200">
      {/* Connected Doctor Dossier View */}
      {hasDoctor && !isChangingDoctor && (
        <div className="space-y-4">
          <Card className="border-deep-ink/10 space-y-4 rounded-2xl border bg-white p-5 shadow-2xs">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-teal-200 bg-teal-100 font-serif text-lg font-bold text-teal-800">
                  {doctor?.name ? doctor.name.slice(0, 2).toUpperCase() : 'DR'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-deep-ink font-serif text-lg font-bold">
                      Dr. {doctor?.name}
                    </h3>
                    <Badge variant="success" className="text-[10px]">
                      Connected
                    </Badge>
                  </div>
                  <p className="text-slate text-xs font-medium">
                    {doctor?.specialty || 'General Practice'}
                  </p>
                </div>
              </div>
            </div>

            {/* Doctor practice info grid */}
            <div className="bg-soft-meadow/50 border-deep-ink/5 grid grid-cols-1 gap-3 rounded-xl border p-3.5 text-xs sm:grid-cols-2 sm:p-4 lg:grid-cols-3">
              <div>
                <span className="text-slate block text-[11px]">Clinic / Hospital</span>
                <span className="text-deep-ink block truncate font-semibold">
                  {doctor?.clinic || 'Independent Practice'}
                </span>
              </div>

              <div>
                <span className="text-slate block text-[11px]">Care Code</span>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="text-deep-ink border-deep-ink/10 rounded border bg-white px-2 py-0.5 font-mono font-bold">
                    {doctor?.careCode || 'NOA-CARE'}
                  </span>
                  <button
                    onClick={() => handleCopy(doctor?.careCode || '')}
                    className="text-slate hover:text-deep-ink cursor-pointer p-1"
                    title="Copy Care Code"
                  >
                    {copiedCode ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {doctor?.email && (
                <div className="text-slate border-deep-ink/5 flex items-center gap-1.5 border-t pt-1 sm:col-span-2 sm:border-t-0 sm:pt-0 lg:col-span-1 lg:border-t-0">
                  <Mail className="text-slate/70 h-3.5 w-3.5" />
                  <span className="truncate">{doctor.email}</span>
                </div>
              )}
            </div>

            {/* Clinical Link Benefit Notice */}
            <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-900">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <p className="leading-relaxed">
                Dr. {doctor?.name} has authorized access to review your AI intake submissions, session transcripts, and SOAP clinical care plans.
              </p>
            </div>

            {/* Switch / Change Doctor button */}
            <div className="pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsChangingDoctor(true)}
                className="text-slate hover:text-deep-ink border-deep-ink/15 h-9 w-full rounded-xl text-xs font-semibold"
              >
                Connect with Different Doctor
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Doctor Connect Card (When not connected, pending, or changing doctor) */}
      {(!hasDoctor || isChangingDoctor || isPendingApproval) && (
        <div className="space-y-3">
          {isChangingDoctor && (
            <div className="flex items-center justify-between px-1">
              <span className="text-slate text-xs">Connect with new healthcare provider</span>
              <Button
                variant="link"
                size="xs"
                onClick={() => setIsChangingDoctor(false)}
                className="text-deep-ink font-semibold"
              >
                Cancel
              </Button>
            </div>
          )}

          <DoctorConnectCard
            pendingDoctor={pendingDoctor}
            linkStatus={patient?.linkStatus}
            onRefresh={async () => {
              await onRefresh();
              setIsChangingDoctor(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
