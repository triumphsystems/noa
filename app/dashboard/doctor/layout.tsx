import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { requireServerAuth } from '@/lib/auth/server';
import { getDoctorById } from '@/lib/db';
import { DoctorLayoutShell } from '@/components/doctor';

export default async function DoctorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await requireServerAuth(['doctor']);
  const doctor = await getDoctorById(auth.sub);

  const headerList = await headers();
  const pathname = headerList.get('x-pathname') || '';
  const isOnboardingRoute = pathname === '/dashboard/doctor/onboarding';

  // Server-side enforcement of credential review lockout:
  // If doctor's medical license is under review or rejected, redirect to onboarding on the server
  if (
    doctor &&
    doctor.verificationStatus &&
    doctor.verificationStatus !== 'verified' &&
    !isOnboardingRoute
  ) {
    redirect('/dashboard/doctor/onboarding');
  }

  return <DoctorLayoutShell doctor={doctor}>{children}</DoctorLayoutShell>;
}
