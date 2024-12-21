'use client'

import React, { createContext, useState, useContext, useEffect } from 'react'
import { createClient, User } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface AuthContextType {
  user: (User & { role?: string | null }) | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ user: User | null; error: Error | null }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<(User & { role?: string | null }) | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUserRole = async (userId: string) => {
    console.log('Fetching user role for userId:', userId)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()
      
      if (error) {
        console.error('Error fetching user role:', error)
        return null
      }
      
      console.log('Fetched user role:', data?.role)
      return data?.role
    } catch (error) {
      console.error('Error in fetchUserRole:', error)
      return null
    }
  }

  useEffect(() => {
    const setupAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const role = await fetchUserRole(session.user.id)
        setUser({ ...session.user, role })
      }
      setLoading(false)

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed. Event:', event)
        if (session) {
          console.log('Session found:', session)
          const role = await fetchUserRole(session.user.id)
          setUser({ ...session.user, role })
        } else {
          setUser(null)
        }
      })

      return () => {
        subscription.unsubscribe()
      }
    }

    setupAuth()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) throw error;

      if (data.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('status')
          .eq('id', data.user.id)
          .single();

        if (profileError) throw profileError;

        if (profileData.status === 'pending') {
          await supabase.auth.signOut();
          throw new Error('Ihr Konto wurde noch nicht freigegeben. Bitte warten Sie auf die Genehmigung durch einen Administrator.');
        }

        const role = profileData.status === 'admin' ? 'admin' : 'user';
        setUser({ ...data.user, role });
        console.log('User role set:', role);
        return { user: data.user, error: null };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { user: null, error };
    }
  };

  const logout = async () => {
    console.log('Logout attempt')
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Logout error:', error)
      throw error
    }
    setUser(null)
    console.log('User logged out and set to null')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
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

