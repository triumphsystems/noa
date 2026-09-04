import { Suspense } from 'react'
import ResetPasswordForm from '@/components/auth/reset-password-form'

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-white/50" />}>
      <ResetPasswordForm />
    </Suspense>
  )
}
