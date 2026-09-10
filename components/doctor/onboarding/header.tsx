'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, RefreshCw, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OnboardingHeaderProps {
  isVerified: boolean;
  onCheckStatus: () => void;
}

export function OnboardingHeader({
  isVerified,
  onCheckStatus,
}: OnboardingHeaderProps) {
  return (
    <div className="border-deep-ink/10 flex flex-col justify-between gap-4 border-b pb-6 sm:flex-row sm:items-center">
      <div>
        <div className="mb-1.5 flex items-center gap-2">
          <span className="bg-soft-meadow border-deep-ink/10 text-deep-ink inline-flex rounded-lg border p-1.5">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <span className="text-deep-ink/75 font-sans text-xs font-semibold tracking-wider uppercase">
            Clinical Compliance & Credentialing
          </span>
        </div>
        <h1 className="text-deep-ink font-serif text-2xl font-bold tracking-tight sm:text-3xl">
          Doctor Licensure & Verification
        </h1>
        <p className="text-slate mt-1 max-w-2xl text-xs sm:text-sm">
          To ensure patient safety and HIPAA compliance, all healthcare
          providers must hold a verified medical license before accessing
          electronic health records and clinical consultation tools.
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onCheckStatus}
          className="gap-2 rounded-lg text-xs font-medium"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Check Status</span>
        </Button>
        {isVerified && (
          <Link href="/dashboard/doctor">
            <Button
              size="sm"
              variant="dark"
              className="gap-2 rounded-lg text-xs font-semibold"
            >
              <span>Enter Practice</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
