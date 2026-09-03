import { Suspense } from 'react'
import SignupForm from '@/components/auth/signup-form'

type SignupPageProps = {
  searchParams?: Promise<{
    type?: string
  }>
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const resolvedSearchParams = await searchParams
  const userType = resolvedSearchParams?.type === 'patient' ? 'patient' : 'doctor'

  return (
    <Suspense fallback={<div className="space-y-6" />}>
      <SignupForm userType={userType} />
    </Suspense>
  )
}
