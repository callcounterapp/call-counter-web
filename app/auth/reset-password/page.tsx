import { Suspense } from 'react'
import ResetPasswordForm from './reset-password-form'

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Laden...</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}

