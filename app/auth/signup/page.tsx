import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import SignupForm from '@/components/auth/signup-form';
import { getServerAuth } from '@/lib/auth/server';
import { getDashboardPath, isValidRole } from '@/lib/auth/roles';

type SignupPageProps = {
  searchParams?: Promise<{
    type?: string;
  }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const auth = await getServerAuth();
  if (auth.isValid && isValidRole(auth.userType)) {
    redirect(getDashboardPath(auth.userType));
  }

  const resolvedSearchParams = await searchParams;
  const userType =
    resolvedSearchParams?.type === 'patient' ? 'patient' : 'doctor';

  return (
    <Suspense fallback={<div className="space-y-6" />}>
      <SignupForm userType={userType} />
    </Suspense>
  );
}
