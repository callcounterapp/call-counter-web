import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const token = requestUrl.searchParams.get('token')
  const next = requestUrl.searchParams.get('next') || '/'

  if (token && next.includes('reset-password')) {
    // Redirect to the password reset page with the token
    return NextResponse.redirect(new URL(`/auth/reset-password?token=${token}`, requestUrl.origin))
  }

  // Handle other auth callbacks
  return NextResponse.redirect(new URL(next, requestUrl.origin))
}

