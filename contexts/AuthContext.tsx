'use client'

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react'
import { createClient, User as SupabaseUser, Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type ExtendedUser = SupabaseUser & {
  role?: string | null
  full_name?: string
  company_name?: string
}

interface AuthContextType {
  user: ExtendedUser | null
  session: Session | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ user: ExtendedUser | null; error: string | null }>
  logout: () => Promise<void>
  register: (email: string, password: string, name: string, company: string) => Promise<{ error: boolean; message: string }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ExtendedUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchUserProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('role, full_name, company_name, status')
      .eq('id', userId)

    if (error) {
      console.error('Error fetching user profile:', error.message)
      return null
    }

    if (data && data.length > 0) {
      return data[0]
    } else {
      console.warn('No user profile found for ID:', userId)
      return null
    }
  }, [])

  const refreshSession = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setUser(null)
        setSession(null)
        return
      }

      const profile = await fetchUserProfile(session.user.id)
      if (profile) {
        setUser(currentUser => {
          const newUser = { 
            ...session.user, 
            role: profile.role,
            full_name: profile.full_name,
            company_name: profile.company_name
          }
          return JSON.stringify(currentUser) !== JSON.stringify(newUser) ? newUser : currentUser
        })
        setSession(currentSession => 
          JSON.stringify(currentSession) !== JSON.stringify(session) ? session : currentSession
        )
      }
    } catch (error) {
      console.error('Error refreshing session:', error)
      setUser(null)
      setSession(null)
    } finally {
      setLoading(false)
    }
  }, [fetchUserProfile])

  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session) {
            const profile = await fetchUserProfile(session.user.id)
            setUser({ ...session.user, ...profile })
            setSession(session)
          } else {
            setUser(null)
            setSession(null)
          }
        } catch (error) {
          console.error('Visibility change session refresh error:', error)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [fetchUserProfile])

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        if (error.message === 'Invalid login credentials') {
          return { user: null, error: 'Ungültige Anmeldedaten. Bitte überprüfen Sie Ihre E-Mail und Ihr Passwort.' }
        }
        return { user: null, error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.' }
      }

      const profile = await fetchUserProfile(data.user.id)
      if (profile && profile.status === 'pending') {
        return { user: null, error: 'Ihr Konto wurde noch nicht freigeschaltet. Bitte warten Sie auf die Bestätigung durch einen Administrator.' }
      }
      const extendedUser = { ...data.user, ...profile }
      setUser(extendedUser)
      setSession(data.session)
      return { user: extendedUser, error: null }
    } catch (error) {
      console.error('Login error:', error)
      return { user: null, error: 'Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.' }
    }
  }

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
      setSession(null)
      router.push('/auth/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const register = async (email: string, password: string, name: string, company: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        if (error.message === 'User already registered') {
          return { error: true, message: 'Diese E-Mail-Adresse ist bereits registriert.' }
        }
        if (error.message === 'Password should be at least 6 characters.') {
          return { error: true, message: 'Das Passwort muss mindestens 6 Zeichen lang sein.' }
        }
        throw error
      }

      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').insert([
          { 
            id: data.user.id, 
            email: email,  
            full_name: name, 
            company_name: company, 
            status: 'pending', 
            role: 'user' 
          },
        ])
        if (profileError) throw profileError

        return { error: false, message: 'Registrierung erfolgreich. Bitte warten Sie auf die Freigabe durch einen Administrator.' }
      } else {
        throw new Error('Benutzerregistrierung fehlgeschlagen: Keine Benutzerdaten zurückgegeben')
      }
    } catch (error) {
      console.error('Registration error:', error)
      return { error: true, message: `Registrierung fehlgeschlagen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}` }
    }
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

