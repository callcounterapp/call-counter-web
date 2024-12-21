'use client'

import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react'
import { createClient, User as SupabaseUser } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface User {
  id: string
  email: string
  status: 'pending' | 'active'
  role?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, fullName: string, companyName: string) => Promise<{ success: boolean; message: string }>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
  clearUserData: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authInitialized, setAuthInitialized] = useState(false)

  const getUserProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('status, role')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user profile:', error)
      return null
    }

    return data
  }, [])

  const updateUserState = useCallback(async (supabaseUser: SupabaseUser | null) => {
    try {
      if (!supabaseUser) {
        setUser(null)
        return
      }

      const profile = await getUserProfile(supabaseUser.id)
      if (!profile) {
        setUser(null)
        return
      }

      setUser({
        id: supabaseUser.id,
        email: supabaseUser.email!,
        status: profile.status,
        role: profile.role
      })
    } catch (error) {
      console.error('Error updating user state:', error)
      setUser(null)
    }
  }, [getUserProfile])

  const refreshSession = useCallback(async () => {
    try {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await updateUserState(session.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Session refresh error:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [updateUserState])

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      })
      
      if (error) {
        if (error.message === 'Invalid login credentials') {
          throw new Error('Ungültige Anmeldedaten. Bitte überprüfen Sie Ihre E-Mail und Ihr Passwort.')
        }
        throw error
      }

      if (data.user) {
        const profile = await getUserProfile(data.user.id)
        if (!profile) throw new Error('Benutzerprofil nicht gefunden')
        
        if (profile.status !== 'active') {
          await supabase.auth.signOut()
          throw new Error('Ihr Konto wurde noch nicht freigeschaltet.')
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [getUserProfile])

  const register = useCallback(async (email: string, password: string, fullName: string, companyName: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password 
      })
    
      if (error) {
        if (error.message.includes('Email already registered')) {
          throw new Error('Diese E-Mail-Adresse ist bereits registriert.')
        }
        throw error
      }

      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            full_name: fullName,
            company_name: companyName,
            status: 'pending',
            role: 'user'
          })

        if (profileError) {
          await supabase.auth.admin.deleteUser(data.user.id)
          throw new Error('Fehler bei der Erstellung des Benutzerprofils. Bitte versuchen Sie es erneut.')
        }

        await supabase.auth.signOut()
        return { 
          success: true, 
          message: 'Registrierung erfolgreich. Bitte warten Sie auf die Freischaltung Ihres Kontos.' 
        }
      }

      throw new Error('Registrierung fehlgeschlagen. Bitte versuchen Sie es erneut.')
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
    } catch (error) {
      console.error('Logout error:', error)
      if (error instanceof Error && error.message.includes('Auth session missing')) {
        setUser(null)
      } else {
        throw error
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const clearUserData = useCallback(() => {
    setUser(null)
  }, [])

  // Initialize auth
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          await updateUserState(session.user)
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        setUser(null)
      } finally {
        setLoading(false)
        setAuthInitialized(true)
      }
    }

    initializeAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (authInitialized) {
        setLoading(true)
        if (session) {
          await updateUserState(session.user)
        } else {
          setUser(null)
        }
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [authInitialized, updateUserState])

  // Handle tab focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        refreshSession()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [user, refreshSession])

  const contextValue = useMemo(() => ({
    user,
    loading,
    login,
    register,
    logout,
    refreshSession,
    clearUserData
  }), [user, loading, login, register, logout, refreshSession, clearUserData])

  return (
    <AuthContext.Provider value={contextValue}>
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

