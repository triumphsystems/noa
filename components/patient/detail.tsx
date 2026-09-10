'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ConsultationHeader } from '@/components/patient/consultation-header';
import { CarePlanView } from '@/components/patient/plan';
import type { PatientSessionDetailData } from '@/lib/data/summaries';

interface ConsultationDetailViewProps {
  initialData: PatientSessionDetailData;
}

export function ConsultationDetailView({
  initialData,
}: ConsultationDetailViewProps) {
  const { session, doctor } = initialData;

  const dateStr = session.startedAt
    ? new Date(session.startedAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recent Visit';

  const summaryText =
    session.soapNote?.subjective ||
    session.soapNote?.assessment ||
    session.transcript ||
    'Clinical consultation completed.';

  const recommendations = session.soapNote?.plan
    ? session.soapNote.plan.split('\n').filter(Boolean)
    : [
        'Follow prescribed medications.',
        'Contact clinician if symptoms persist.',
      ];

  const nextStepsText = session.soapNote?.plan
    ? 'Follow outlined care plan and reach out to provider if symptoms persist.'
    : 'Schedule follow-up appointment as advised by your clinical team.';

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 font-sans sm:p-6 lg:p-8">
      <Link
        href="/dashboard/patient?tab=visits"
        className="text-slate hover:text-deep-ink inline-flex items-center gap-1.5 text-xs font-semibold"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to Consultations</span>
      </Link>
      <ConsultationHeader
        date={dateStr}
        doctorName={doctor?.name ? `Dr. ${doctor.name}` : 'Assigned Clinician'}
        onDownloadPDF={() => {
          if (typeof window !== 'undefined') window.print();
        }}
        onPrint={() => {
          if (typeof window !== 'undefined') window.print();
        }}
      />
      <CarePlanView
        summary={summaryText}
        recommendations={recommendations}
        nextSteps={nextStepsText}
      />
    </div>
  );
}
