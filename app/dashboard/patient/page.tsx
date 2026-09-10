import { requireServerAuth } from '@/lib/auth/server';
import { getPatientData } from '@/lib/data/patient';
import { PatientDashboardView } from '@/components/patient';
import { ErrorAlert } from '@/components/ui/error-alert';

export default async function PatientDashboardPage() {
  const auth = await requireServerAuth(['patient']);
  const dashboardData = await getPatientData(auth.sub);

  if (!dashboardData) {
    return (
      <div className="mx-auto max-w-md p-6 pt-12">
        <ErrorAlert
          variant="card"
          title="Patient Record Not Found"
          message="Your patient profile could not be loaded. Please contact support."
        />
      </div>
    );
  }

  return <PatientDashboardView initialData={dashboardData} />;
}
