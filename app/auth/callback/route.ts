import { NextResponse } from 'next/server'
import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const token = requestUrl.searchParams.get('token')
  const next = requestUrl.searchParams.get('next') || '/'

  // Immer zu call-counter.de umleiten
  const baseUrl = 'https://call-counter.de'

  if (token && next.includes('reset-password')) {
    // Umleitung zur Passwort-Zurücksetz-Seite mit dem Token
    return NextResponse.redirect(`${baseUrl}/auth/reset-password?token=${token}`)
  }

  // Andere Auth-Callbacks behandeln
  return NextResponse.redirect(`${baseUrl}${next}`)
}

