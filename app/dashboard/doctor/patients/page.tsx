import { requireServerAuth } from '@/lib/auth/server';
import { getDoctorPatientsData } from '@/lib/data/doctor';
import { PatientsView } from '@/components/doctor/patients';
import { ErrorAlert } from '@/components/ui/error-alert';

export default async function PatientsPage() {
  const auth = await requireServerAuth(['doctor']);
  const data = await getDoctorPatientsData(auth.sub);

  if (!data) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <ErrorAlert message="Clinician record not found. Please contact administration." />
      </div>
    );
  }

  return (
    <PatientsView
      initialDoctor={data.doctor}
      initialPatients={data.patients}
    />
  );
}
