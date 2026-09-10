'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserCheck, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import type { Doctor } from '@/lib/db';

interface DoctorInvitationBannerProps {
  pendingDoctor: Doctor;
  isSubmitting: boolean;
  onRespond: (action: 'accept' | 'decline') => Promise<void>;
}

export function DoctorInvitationBanner({
  pendingDoctor,
  isSubmitting,
  onRespond,
}: DoctorInvitationBannerProps) {
  return (
    <div className="border-hi-yellow/40 bg-hi-yellow/10 animate-in fade-in space-y-4 rounded-xl border p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="bg-hi-yellow/20 text-deep-ink flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-deep-ink font-serif text-base font-semibold">
                Dr. {pendingDoctor.name} invited you to connect
              </h4>
              <Badge
                variant="secondary"
                className="text-[10px] font-semibold tracking-wider uppercase"
              >
                Invitation
              </Badge>
            </div>
            <p className="text-slate mt-1 text-xs">
              Connecting allows Dr. {pendingDoctor.name} (
              {pendingDoctor.clinic || pendingDoctor.specialty}) to review your
              AI intake summaries and consultation notes.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button
          onClick={() => onRespond('accept')}
          disabled={isSubmitting}
          className="bg-deep-ink text-canvas hover:bg-deep-ink/90 h-auto cursor-pointer gap-1.5 rounded-full px-5 py-2 text-xs font-medium shadow-2xs"
        >
          {isSubmitting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="h-3.5 w-3.5" />
          )}
          Accept & Connect
        </Button>
        <Button
          onClick={() => onRespond('decline')}
          disabled={isSubmitting}
          variant="outline"
          className="border-deep-ink/20 text-slate hover:text-deep-ink h-auto cursor-pointer gap-1.5 rounded-full px-4 py-2 text-xs font-medium"
        >
          <XCircle className="h-3.5 w-3.5" />
          Decline
        </Button>
      </div>
    </div>
  );
}
