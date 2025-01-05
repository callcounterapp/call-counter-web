import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Überprüfe die URL-Parameter
  const url = new URL(req.url)
  const access_token = url.searchParams.get('access_token')
  const refresh_token = url.searchParams.get('refresh_token')

  // Wenn Token vorhanden sind, erlaube den Zugriff auf die Reset-Seite
  if (req.nextUrl.pathname === '/auth/reset-password' && (access_token || refresh_token)) {
    return res
  }

  // Überprüfe die Session für andere geschützte Routen
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (req.nextUrl.pathname === '/auth/reset-password' && !session) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }

  return res
}

export const config = {
  matcher: ['/auth/reset-password']
}

