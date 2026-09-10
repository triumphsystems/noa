'use client';

import React from 'react';
import Link from 'next/link';
import { Activity, LogOut } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HealthInfoCard } from './health-info-card';
import { PrivacyNoticeCard } from './privacy-notice-card';
import type { PatientProfile } from '@/lib/types/patient.types';
import type { PatientIntake } from '@/lib/db';

interface PatientRecordsProps {
  patient: PatientProfile | null;
  intake: PatientIntake | null;
  onLogout: () => void;
}

export function PatientRecords({
  patient,
  intake,
  onLogout,
}: PatientRecordsProps) {
  return (
    <div className="animate-in fade-in space-y-4 duration-200">
      {/* Screen Header */}
      <div className="border-deep-ink/10 flex items-center justify-between rounded-2xl border bg-white p-4 shadow-2xs">
        <div>
          <h2 className="text-deep-ink font-serif text-lg font-bold">
            Health Records
          </h2>
          <p className="text-slate text-xs">
            Your verified medical baseline and security rights.
          </p>
        </div>
        <Link href="/intake">
          <Button
            size="sm"
            className="bg-hi-yellow text-deep-ink h-8 rounded-full text-xs font-semibold"
          >
            Update Intake
          </Button>
        </Link>
      </div>

      {/* Health Info Card (Meds & Allergies) */}
      <HealthInfoCard patient={patient} intake={intake} />

      {/* Intake Profile Card */}
      <Card className="border-deep-ink/10 space-y-3 rounded-2xl border bg-white p-5 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-soft-meadow text-deep-ink flex h-8 w-8 items-center justify-center rounded-lg">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-deep-ink font-serif text-sm font-bold">
                Clinical Intake Status
              </h3>
              <p className="text-slate text-[11px]">
                {intake?.updatedAt
                  ? `Last updated on ${new Date(intake.updatedAt).toLocaleDateString()}`
                  : 'Preliminary baseline intake recorded'}
              </p>
            </div>
          </div>
          <Badge
            variant={intake ? 'success' : 'default'}
            className="text-[10px]"
          >
            {intake ? 'Completed' : 'Pending'}
          </Badge>
        </div>

        {intake?.chiefComplaint && (
          <div className="bg-soft-meadow/50 border-deep-ink/5 text-deep-ink space-y-1 rounded-xl border p-3 text-xs">
            <span className="text-slate block text-[11px] font-semibold">
              Primary Chief Complaint:
            </span>
            <p className="leading-relaxed">{intake.chiefComplaint}</p>
          </div>
        )}
      </Card>

      {/* End to End Privacy Notice */}
      <PrivacyNoticeCard />

      {/* Sign Out Card */}
      <div className="pt-2">
        <Button
          variant="outline"
          onClick={onLogout}
          className="h-10 w-full cursor-pointer gap-2 rounded-2xl border-rose-200 text-xs font-semibold text-rose-700 hover:border-rose-300 hover:bg-rose-50"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out of Patient Portal</span>
        </Button>
      </div>
    </div>
  );
}
