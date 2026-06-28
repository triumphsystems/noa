import { Suspense } from 'react'
import SignupForm from './signup-form'

type SignupPageProps = {
  searchParams?: {
    type?: string
  }
}

export default function SignupPage({ searchParams }: SignupPageProps) {
  const userType = searchParams?.type === 'patient' ? 'patient' : 'doctor'

  return (
    <Suspense fallback={<div className="space-y-6" />}>
      <SignupForm userType={userType} />
    </Suspense>
  )
}
