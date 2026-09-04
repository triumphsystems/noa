import { Suspense } from 'react'
import ForgotPasswordForm from '@/components/auth/forgot-password-form'

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-white/50" />}>
      <ForgotPasswordForm />
    </Suspense>
  )
}
