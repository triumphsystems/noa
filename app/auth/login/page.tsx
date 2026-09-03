import { Suspense } from 'react'
import LoginForm from '@/components/auth/login-form'

type LoginPageProps = {
  searchParams?: Promise<{
    type?: string
  }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams
  const userType = params?.type === 'patient' ? 'patient' : 'doctor'

  return (
    <Suspense fallback={<div className="space-y-6" />}>
      <LoginForm userType={userType} />
    </Suspense>
  )
}
