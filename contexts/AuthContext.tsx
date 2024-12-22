'use client'

import React, { createContext, useState, useContext, useEffect } from 'react'
import { createClient, User as SupabaseUser } from '@supabase/supabase-js'

type ExtendedUser = SupabaseUser & {
  role?: string | null
  full_name?: string
  company_name?: string
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface AuthContextType {
  user: ExtendedUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ user: ExtendedUser | null; error: Error | null }>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string, company: string) => Promise<{ message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ExtendedUser | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUserRole = async (userId: string) => {
    console.log('Fetching user role for userId:', userId)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, full_name, company_name, status') 
        .eq('id', userId)
        .single()
      
      if (error) {
        console.error('Error fetching user role:', error.message, error.details, error.hint)
        return null
      }
      
      if (!data) {
        console.error('No data returned when fetching user role')
        return null
      }
      
      console.log('Fetched user data:', data)
      return data
    } catch (error) {
      console.error('Unexpected error in fetchUserRole:', error)
      return null
    }
  }

  useEffect(() => {
    const setupAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Error getting session:', sessionError)
          setLoading(false)
          return
        }

        if (session) {
          console.log('Session found:', session)
          const roleData = await fetchUserRole(session.user.id)
          if (roleData) {
            setUser({ ...session.user, ...roleData })
          } else {
            console.error('Failed to fetch user role data')
          }
        } else {
          console.log('No active session found')
        }
      } catch (error) {
        console.error('Unexpected error in setupAuth:', error)
      } finally {
        setLoading(false)
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed. Event:', event)
        if (session) {
          console.log('New session:', session)
          const roleData = await fetchUserRole(session.user.id)
          if (roleData) {
            setUser({ ...session.user, ...roleData })
          } else {
            console.error('Failed to fetch user role data after auth state change')
          }
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

  const login = async (email: string, password: string): Promise<{ user: ExtendedUser | null; error: Error | null }> => {
    try {
      console.log('Attempting login for email:', email)
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        console.error('Supabase signInWithPassword error:', error.message)
        throw error;
      }

      if (!data.user) {
        console.error('Login failed: No user data returned')
        return { user: null, error: new Error('Login failed: No user data returned') };
      }

      console.log('User authenticated:', data.user)
      const profileData = await fetchUserRole(data.user.id);

      if (!profileData) {
        console.error('Failed to fetch user profile data')
        return { user: null, error: new Error('Failed to fetch user profile data') };
      }

      if (profileData.status === 'pending') {
        console.log('User account is pending approval')
        await supabase.auth.signOut();
        return { user: null, error: new Error('Ihr Konto wurde noch nicht freigegeben. Bitte warten Sie auf die Genehmigung durch einen Administrator.') };
      }

      const role = profileData.status === 'admin' ? 'admin' : 'user';
      const extendedUser: ExtendedUser = { 
        ...data.user, 
        role, 
        full_name: profileData.full_name, 
        company_name: profileData.company_name 
      };
      setUser(extendedUser);
      console.log('User logged in successfully:', extendedUser)
      return { user: extendedUser, error: null };
    } catch (error) {
      console.error('Login error:', error);
      return { user: null, error: error instanceof Error ? error : new Error('Unknown error') };
    }
  };

  const logout = async () => {
    console.log('Logout attempt')
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Logout error:', error)
        throw error
      }
      setUser(null)
      console.log('User logged out and set to null')
    } catch (error) {
      console.error('Unexpected error during logout:', error)
      throw error
    }
  }

  const register = async (email: string, password: string, name: string, company: string) => {
    try {
      console.log('Attempting to register user:', email)
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password
      })
      if (error) throw error
      if (data.user) {
        console.log('User registered successfully:', data.user)
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{ id: data.user.id, name: name, company: company, status: 'pending', role: 'user' }])
        if (profileError) {
          console.error('Error creating user profile:', profileError)
          throw profileError
        }
        console.log('User profile created successfully')
        return { message: 'Registrierung erfolgreich. Bitte warten Sie auf die Freigabe durch einen Administrator.' }
      } else {
        throw new Error('Benutzerregistrierung fehlgeschlagen: Keine Benutzerdaten zurückgegeben')
      }
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
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

