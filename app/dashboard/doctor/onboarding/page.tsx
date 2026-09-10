import * as React from 'react';
import { requireServerAuth } from '@/lib/auth/server';
import { getDoctorById } from '@/lib/db';
import { DoctorOnboardingView } from '@/components/doctor/onboarding';
import { Card } from '@/components/ui/card';

export default async function DoctorOnboardingPage() {
  const auth = await requireServerAuth(['doctor']);
  const doctor = await getDoctorById(auth.sub);

  if (!doctor) {
    return (
      <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-10">
        <Card className="border-dashed p-8 text-center">
          <p className="text-slate text-sm">Doctor profile not found.</p>
        </Card>
      </div>
    );
  }

  return <DoctorOnboardingView initialDoctor={doctor} />;
}
