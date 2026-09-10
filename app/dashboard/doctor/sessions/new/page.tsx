import * as React from 'react';
import { Suspense } from 'react';
import { requireServerAuth } from '@/lib/auth/server';
import { getDoctorById, getPatientsByDoctor } from '@/lib/db';
import { SessionConsole } from '@/components/session';
import { Card } from '@/components/ui/card';

export default async function NewSessionPage() {
  const auth = await requireServerAuth(['doctor']);
  const doctor = await getDoctorById(auth.sub);

  if (!doctor) {
    return (
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <Card className="border-dashed p-8 text-center">
          <p className="text-slate text-sm">Doctor profile not found.</p>
        </Card>
      </div>
    );
  }

  const patients = await getPatientsByDoctor(auth.sub);

  return (
    <Suspense
      fallback={
        <div className="text-slate mx-auto max-w-5xl p-12 text-center text-sm">
          Loading consultation console...
        </div>
      }
    >
      <SessionConsole initialPatients={patients} doctorId={auth.sub} />
    </Suspense>
  );
}
