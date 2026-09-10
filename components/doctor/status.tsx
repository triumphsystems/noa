'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowRight, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DoctorVerificationNoticeProps {
  status: 'pending' | 'rejected';
  license?: string;
  rejectionReason?: string | null;
}

export function DoctorVerificationNotice({
  status,
  license,
  rejectionReason,
}: DoctorVerificationNoticeProps) {
  return (
    <Card
      className={cn(
        'border p-5 shadow-xs sm:p-6',
        status === 'pending'
          ? 'border-amber-200/80 bg-amber-50/70 text-amber-950'
          : 'border-rose-200 bg-rose-50/70 text-rose-950'
      )}
    >
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3.5">
          <div
            className={cn(
              'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border',
              status === 'pending'
                ? 'border-amber-300/80 bg-amber-100 text-amber-800'
                : 'border-rose-300 bg-rose-100 text-rose-800'
            )}
          >
            {status === 'pending' ? (
              <Clock className="h-5 w-5 animate-pulse" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px] font-bold tracking-wider uppercase',
                  status === 'pending'
                    ? 'border-amber-300 bg-amber-100 text-amber-900'
                    : 'border-rose-300 bg-rose-100 text-rose-900'
                )}
              >
                {status === 'pending'
                  ? 'Verification In Progress'
                  : 'Action Required'}
              </Badge>
              <span className="text-slate/80 font-mono text-xs">
                License:{' '}
                {license && license !== 'LICENSE-PENDING'
                  ? license
                  : 'Pending submission'}
              </span>
            </div>
            <h3 className="text-deep-ink font-serif text-base font-bold">
              {status === 'pending'
                ? 'Clinical Credential Review Pending'
                : 'Credential Verification Requires Revision'}
            </h3>
            <p className="text-slate max-w-2xl text-xs leading-relaxed sm:text-sm">
              {status === 'pending'
                ? 'Your medical license and practice credentials are currently being reviewed by clinical administration. Patient consultations and SOAP note synthesis will unlock once approved.'
                : `Your credentials were not approved: "${rejectionReason || 'Details incomplete'}". Please update your license information to resubmit for verification.`}
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/doctor/onboarding"
          className="w-full shrink-0 sm:w-auto"
        >
          <Button
            variant="dark"
            size="sm"
            className="w-full gap-2 rounded-lg text-xs font-semibold sm:w-auto"
          >
            <span>
              {status === 'pending'
                ? 'View Credential Details'
                : 'Update & Resubmit'}
            </span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}
