import { Suspense } from 'react'
import EmailConfirmationContent from './email-confirmation-content'
import { Card } from "@/components/ui/card"

export default function EmailConfirmationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 to-indigo-900">
      <Suspense 
        fallback={
          <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-screen">
            <Card className="w-full max-w-md p-8">
              <div className="animate-pulse flex flex-col items-center space-y-4">
                <div className="h-8 bg-blue-200/20 rounded w-3/4"></div>
                <div className="h-4 bg-blue-200/20 rounded w-1/2"></div>
                <div className="h-32 bg-blue-200/20 rounded w-full"></div>
              </div>
            </Card>
          </div>
        }
      >
        <EmailConfirmationContent />
      </Suspense>
    </div>
  )
}

