import * as React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireServerAuth } from '@/lib/auth/server';
import { getPatientSessionDetail } from '@/lib/data/summaries';
import { ConsultationDetailView } from '@/components/patient';
import { Card } from '@/components/ui/card';

interface PatientConsultationPageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default async function PatientConsultationPage({
  params,
}: PatientConsultationPageProps) {
  const auth = await requireServerAuth(['patient']);
  const unwrappedParams = await (params instanceof Promise
    ? params
    : Promise.resolve(params));
  const sessionId = unwrappedParams.id;

  const data = await getPatientSessionDetail(auth.sub, sessionId);

  if (!data) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8">
        <Link
          href="/dashboard/patient?tab=visits"
          className="text-slate hover:text-deep-ink inline-flex items-center gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Consultations</span>
        </Link>
        <Card className="border-dashed p-8 text-center">
          <p className="text-slate text-sm">
            Consultation summary not found or you do not have permission to view
            it.
          </p>
        </Card>
      </div>
    );
  }

  return <ConsultationDetailView initialData={data} />;
}
