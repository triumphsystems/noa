'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { usePatientStore } from '@/lib/stores/patient.store';
import { ConsultationHeader } from '@/components/patient/consultation-header';
import { CarePlanView } from '@/components/patient/care-plan-view';
import { Card } from '@/components/ui/card';
import type { Session } from '@/lib/db';

export default function PatientConsultationPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const unwrappedParams = React.use(
    params instanceof Promise ? params : Promise.resolve(params)
  );
  const sessionId = unwrappedParams.id;
  const { sessions, doctor, patientId, loadDashboard } = usePatientStore();

  const [session, setSession] = React.useState<Session | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const existing = sessions.find((s) => s.id === sessionId);
    if (existing) {
      setSession(existing);
      setLoading(false);
      return;
    }

    fetch(`/api/sessions?sessionId=${encodeURIComponent(sessionId)}`)
      .then((res) => res.json())
      .then((data) => data.success && data.session && setSession(data.session))
      .catch(console.error)
      .finally(() => setLoading(false));

    if (!patientId && typeof window !== 'undefined') {
      const storedId = window.localStorage.getItem('patientId');
      if (storedId) void loadDashboard(storedId);
    }
  }, [sessionId, sessions, patientId, loadDashboard]);

  const dateStr = session?.startedAt
    ? new Date(session.startedAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Recent Visit';

  const summaryText =
    session?.soapNote?.subjective ||
    session?.soapNote?.assessment ||
    session?.transcript ||
    'Clinical consultation completed.';

  const recommendations = session?.soapNote?.plan
    ? session.soapNote.plan.split('\n').filter(Boolean)
    : [
        'Follow prescribed medications.',
        'Contact clinician if symptoms persist.',
      ];

  const nextStepsText = session?.soapNote?.plan
    ? 'Follow outlined care plan and reach out to provider if symptoms persist.'
    : 'Schedule follow-up appointment as advised by your clinical team.';

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl animate-pulse space-y-6 p-4 sm:p-6 lg:p-8">
        <div className="bg-deep-ink/10 h-6 w-32 rounded" />
        <div className="bg-deep-ink/5 h-20 rounded-2xl" />
        <div className="bg-deep-ink/5 h-64 rounded-2xl" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8">
        <Link
          href="/dashboard/patient"
          className="text-slate hover:text-deep-ink inline-flex items-center gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Portal</span>
        </Link>
        <Card className="border-dashed p-8 text-center">
          <p className="text-slate text-sm">Consultation summary not found.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8">
      <Link
        href="/dashboard/patient"
        className="text-slate hover:text-deep-ink inline-flex items-center gap-1.5 text-xs font-semibold"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to Portal</span>
      </Link>
      <ConsultationHeader
        date={dateStr}
        doctorName={doctor?.name || 'Assigned Clinician'}
        onDownloadPDF={() => alert('Downloading consultation summary PDF...')}
        onPrint={() => window.print()}
      />
      <CarePlanView
        summary={summaryText}
        recommendations={recommendations}
        nextSteps={nextStepsText}
      />
    </div>
  );
}
