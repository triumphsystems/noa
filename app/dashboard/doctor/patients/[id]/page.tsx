import Link from 'next/link';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { requireServerAuth } from '@/lib/auth/server';
import { getDoctorPatientDetail } from '@/lib/data/doctor';
import { PatientDetailView } from '@/components/doctor/patients';

export default async function PatientProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const auth = await requireServerAuth(['doctor']);
  const { id: patientId } = await params;
  const data = await getDoctorPatientDetail(auth.sub, patientId);

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <Link
          href="/dashboard/doctor/patients"
          className="text-slate hover:text-deep-ink flex items-center gap-1.5 text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Patients Registry</span>
        </Link>
        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-xs text-rose-900 sm:text-sm">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <span>
            Patient record not found or not connected with your clinic practice.
          </span>
        </div>
      </div>
    );
  }

  return <PatientDetailView initialData={data} />;
}
