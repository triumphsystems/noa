import Link from 'next/link';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { requireServerAuth } from '@/lib/auth/server';
import { getDoctorSessionDetail } from '@/lib/data/summaries';
import { SummaryDetailView } from '@/components/doctor/summaries';

export default async function SummaryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await requireServerAuth(['doctor']);
  const { id: sessionId } = await params;
  const data = await getDoctorSessionDetail(auth.sub, sessionId);

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6 font-sans">
        <Link
          href="/dashboard/doctor/summaries"
          className="text-slate hover:text-deep-ink flex items-center gap-1.5 text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Clinical Summaries</span>
        </Link>
        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-xs text-rose-900 sm:text-sm">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <span>
            Clinical summary could not be found or access is unauthorized.
          </span>
        </div>
      </div>
    );
  }

  return <SummaryDetailView initialData={data} />;
}
