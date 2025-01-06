import { Suspense } from 'react'
import ResetPasswordForm from './reset-password-form'

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-blue-950 to-indigo-900">
        <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
