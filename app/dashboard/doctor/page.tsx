import { requireServerAuth } from '@/lib/auth/server';
import { getDoctorData } from '@/lib/data/doctor';
import { DoctorDashboardView } from '@/components/doctor';
import { ErrorAlert } from '@/components/ui/error-alert';

export default async function DashboardPage() {
  const auth = await requireServerAuth(['doctor']);
  const dashboardData = await getDoctorData(auth.sub);

  if (!dashboardData) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <ErrorAlert message="Clinician profile not found. Please contact administration." />
      </div>
    );
  }

  return <DoctorDashboardView initialData={dashboardData} />;
}
