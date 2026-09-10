import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import LoginForm from '@/components/auth/login-form';
import { getServerAuth } from '@/lib/auth/server';
import { getDashboardPath, isValidRole } from '@/lib/auth/roles';

type LoginPageProps = {
  searchParams?: Promise<{
    type?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const auth = await getServerAuth();
  if (auth.isValid && isValidRole(auth.userType)) {
    redirect(getDashboardPath(auth.userType));
  }

  const params = await searchParams;
  const userType = params?.type === 'patient' ? 'patient' : 'doctor';

  return (
    <Suspense fallback={<div className="space-y-6" />}>
      <LoginForm userType={userType} />
    </Suspense>
  );
}
