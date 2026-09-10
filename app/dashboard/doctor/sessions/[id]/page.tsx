import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { requireServerAuth } from '@/lib/auth/server';
import { getDoctorSessionDetail } from '@/lib/data/summaries';
import { SessionDetail } from '@/components/session';

interface SessionPageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default async function SessionPage({ params }: SessionPageProps) {
  const auth = await requireServerAuth(['doctor']);
  const unwrappedParams = await (params instanceof Promise ? params : Promise.resolve(params));
  const sessionId = unwrappedParams.id;

  const data = await getDoctorSessionDetail(auth.sub, sessionId);

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6 font-sans">
        <Link
          href="/dashboard/doctor"
          className="text-slate hover:text-deep-ink flex items-center gap-1.5 text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Dashboard</span>
        </Link>
        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-xs text-rose-900 sm:text-sm">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <span>Session could not be found or access is unauthorized.</span>
        </div>
      </div>
    );
  }

  return (
    <SessionDetail
      initialSession={data.session}
      initialPatient={data.patient}
      doctor={data.doctor}
    />
  );
}
