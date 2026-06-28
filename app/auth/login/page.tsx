import { Suspense } from 'react'
import LoginForm from './login-form'

type LoginPageProps = {
  searchParams?: {
    type?: string
  }
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const userType = searchParams?.type === 'patient' ? 'patient' : 'doctor'

  return (
    <Suspense fallback={<div className="space-y-6" />}>
      <LoginForm userType={userType} />
    </Suspense>
  )
}
