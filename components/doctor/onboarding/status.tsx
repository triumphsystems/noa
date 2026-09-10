'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface VerificationStatusBannerProps {
  status: 'pending' | 'verified' | 'rejected';
  license?: string;
  issuingAuthority?: string | null;
  rejectionReason?: string | null;
  showEditForm: boolean;
  onToggleEditForm: () => void;
  onOpenEditForm: () => void;
}

export function VerificationStatusBanner({
  status,
  license,
  issuingAuthority,
  rejectionReason,
  showEditForm,
  onToggleEditForm,
  onOpenEditForm,
}: VerificationStatusBannerProps) {
  if (status === 'pending') {
    return (
      <Card className="to-soft-meadow/40 border-amber-200/80 bg-gradient-to-br from-amber-50/70 via-white shadow-xs">
        <CardContent className="flex flex-col items-start justify-between gap-6 p-6 sm:p-8 md:flex-row md:items-center">
          <div className="flex items-start gap-4">
            <div className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-200 bg-amber-100/80 text-amber-700">
              <Clock className="h-6 w-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className="border-amber-200 bg-amber-100 text-xs font-semibold text-amber-800"
                >
                  Review In Progress
                </Badge>
                <span className="text-slate/70 font-mono text-xs">
                  Status: Pending Approval
                </span>
              </div>
              <h2 className="text-deep-ink font-serif text-lg font-bold sm:text-xl">
                Your credentials are under clinical compliance review
              </h2>
              <p className="text-slate max-w-2xl text-xs leading-relaxed sm:text-sm">
                Our credentialing committee validates license numbers against state medical
                boards and international councils. Applications are typically processed
                within 24 business hours.
              </p>
              {license && license !== 'LICENSE-PENDING' && (
                <div className="text-deep-ink/80 flex flex-wrap items-center gap-3 pt-2 text-xs">
                  <span className="font-semibold">Submitted License:</span>
                  <span className="border-deep-ink/10 rounded border bg-white px-2 py-0.5 font-mono">
                    {license}
                  </span>
                  {issuingAuthority && (
                    <span className="text-slate">({issuingAuthority})</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex w-full shrink-0 flex-col gap-2 sm:flex-row md:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleEditForm}
              className="rounded-lg text-xs font-semibold"
            >
              {showEditForm ? 'Hide Details' : 'Edit Credentials'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === 'rejected') {
    return (
      <Card className="border-rose-200 bg-rose-50/50 shadow-xs">
        <CardContent className="flex flex-col items-start justify-between gap-6 p-6 sm:p-8 md:flex-row">
          <div className="flex items-start gap-4">
            <div className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-rose-200 bg-rose-100 text-rose-700">
              <XCircle className="h-6 w-6" />
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Badge variant="danger" className="text-xs font-semibold">
                  Verification Rejected
                </Badge>
                <span className="font-mono text-xs text-rose-700">Action Required</span>
              </div>
              <h2 className="font-serif text-lg font-bold text-rose-950 sm:text-xl">
                Your medical verification request requires revision
              </h2>
              <p className="max-w-2xl text-xs leading-relaxed text-rose-900/80 sm:text-sm">
                The clinical compliance administrator was unable to verify your
                credentials with the details provided.
              </p>
              {rejectionReason && (
                <div className="mt-3 space-y-1 rounded-xl border border-rose-200/80 bg-white p-3.5 text-xs text-rose-900">
                  <span className="block text-[10px] font-bold tracking-wider text-rose-950 uppercase">
                    Administrator Feedback:
                  </span>
                  <p className="leading-relaxed font-medium">{rejectionReason}</p>
                </div>
              )}
            </div>
          </div>

          <Button
            variant="dark"
            size="sm"
            onClick={onOpenEditForm}
            className="shrink-0 rounded-lg text-xs font-semibold"
          >
            Update & Resubmit
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (status === 'verified') {
    return (
      <Card className="border-emerald-200 bg-emerald-50/40 shadow-xs">
        <CardContent className="flex flex-col items-start justify-between gap-6 p-6 sm:p-8 md:flex-row md:items-center">
          <div className="flex items-start gap-4">
            <div className="mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-600">
                  Verified Practitioner
                </Badge>
                <span className="font-mono text-xs text-emerald-800">
                  Clinical Privileges Active
                </span>
              </div>
              <h2 className="text-deep-ink font-serif text-lg font-bold sm:text-xl">
                Your medical license has been verified
              </h2>
              <p className="text-slate max-w-2xl text-xs leading-relaxed sm:text-sm">
                Your account has full clinical documentation privileges, ambient voice
                consultation access, and EHR export capabilities.
              </p>
            </div>
          </div>

          <Link href="/dashboard/doctor">
            <Button
              variant="dark"
              size="sm"
              className="shrink-0 gap-2 rounded-lg text-xs font-semibold"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return null;
}
