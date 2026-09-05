'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ArrowRight, Home } from 'lucide-react';

type IntakeCompletionState = {
  summary?: string;
  language?: string;
  doctorId?: string;
  patientId?: string;
  draft?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    medicalConditions?: string[];
    allergies?: string[];
    currentMedications?: string[];
  };
};

export default function ConfirmationPage() {
  const [completionState, setCompletionState] =
    useState<IntakeCompletionState | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = window.sessionStorage.getItem('intake-completion');
    if (!raw) return;

    try {
      setCompletionState(JSON.parse(raw) as IntakeCompletionState);
    } catch {
      setCompletionState(null);
    }
  }, []);

  const summary =
    completionState?.summary ||
    'Your intake conversation was completed and securely stored in the clinical database.';
  const patientName =
    [completionState?.draft?.firstName, completionState?.draft?.lastName]
      .filter(Boolean)
      .join(' ') || 'Patient';

  return (
    <div className="bg-canvas text-deep-ink flex min-h-screen items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg space-y-5 text-center sm:space-y-6">
        <div className="flex justify-center">
          <div className="bg-moss-green/20 border-moss-green/30 flex h-14 w-14 items-center justify-center rounded-full border shadow-xs sm:h-16 sm:w-16">
            <CheckCircle2 className="text-deep-ink h-8 w-8 sm:h-9 sm:w-9" />
          </div>
        </div>

        <div>
          <h1 className="text-deep-ink mb-2 font-serif text-2xl font-bold sm:text-3xl">
            Intake Complete
          </h1>
          <p className="text-slate text-xs sm:text-sm">
            Thank you, {patientName}. Noa captured your health information
            conversationally and encrypted the intake securely.
          </p>
        </div>

        <Card className="space-y-3 p-4 text-left sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-deep-ink font-serif text-sm font-semibold sm:text-base">
              Conversation Summary
            </h3>
            {completionState?.language && (
              <Badge variant="secondary" className="text-[10px]">
                {completionState.language}
              </Badge>
            )}
          </div>
          <p className="text-slate bg-soft-meadow/50 border-deep-ink/5 rounded-2xl border p-3.5 text-xs leading-relaxed sm:p-4 sm:text-sm">
            {summary}
          </p>
        </Card>

        <Card className="bg-soft-meadow border-deep-ink/10 p-4 text-left sm:p-6">
          <h3 className="text-deep-ink mb-3 font-serif text-sm font-semibold sm:text-base">
            What Happens Next?
          </h3>
          <ol className="text-slate space-y-2.5 text-xs sm:text-sm">
            <li className="flex items-start gap-3">
              <span className="bg-hi-yellow text-deep-ink mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                1
              </span>
              <span>
                Your medical intake is ready for your clinician's review.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-hi-yellow text-deep-ink mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                2
              </span>
              <span>
                Your doctor can access the structured intake and synthesized
                findings.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-hi-yellow text-deep-ink mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                3
              </span>
              <span>
                Access your patient portal to review your consultation records.
              </span>
            </li>
          </ol>
        </Card>

        <div className="space-y-3">
          <Link href="/dashboard/patient" className="block">
            <Button className="bg-hi-yellow text-deep-ink hover:bg-hi-yellow/90 w-full gap-2 rounded-full py-5 font-semibold">
              <span>Go to Patient Portal</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/" className="block">
            <Button
              variant="outline"
              className="border-deep-ink/20 text-deep-ink hover:bg-soft-meadow w-full gap-2 rounded-full py-5 font-medium"
            >
              <Home className="h-4 w-4" />
              <span>Return to Home</span>
            </Button>
          </Link>
        </div>

        <p className="text-slate pt-2 text-xs">
          Questions or need assistance? Contact{' '}
          <a
            href="mailto:support@noa.health"
            className="text-deep-ink font-semibold underline"
          >
            support@noa.health
          </a>
        </p>
      </div>
    </div>
  );
}
