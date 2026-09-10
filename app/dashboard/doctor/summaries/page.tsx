import { requireServerAuth } from '@/lib/auth/server';
import { getDoctorSummariesData } from '@/lib/data/summaries';
import { SummariesView } from '@/components/doctor/summaries';

export default async function SummariesPage() {
  const auth = await requireServerAuth(['doctor']);
  const data = await getDoctorSummariesData(auth.sub);

  return (
    <SummariesView
      initialSessions={data.sessions}
      initialPatients={data.patients}
    />
  );
}
