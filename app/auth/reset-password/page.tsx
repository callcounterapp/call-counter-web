import { Suspense } from 'react'
import ResetPasswordForm from './reset-password-form'

export default function ResetPasswordPage() {
  return (
    <>
      <style jsx global>{`
        body {
          background: linear-gradient(to bottom right, #172554, #312e81);
          margin: 0;
          padding: 0;
          min-height: 100vh;
        }
      `}</style>
      <Suspense fallback={
        <div className="flex justify-center items-center h-screen">
          <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }>
        <ResetPasswordForm />
      </Suspense>
    </>
  )
}

