'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Loader2, User, Briefcase, Calendar, Shield, PhoneCall, AlertCircle, Search } from 'lucide-react'
import { useToast } from "@/components/ui/use-toast"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Profile {
  id: string
  email: string
  full_name: string
  company_name: string
  status: string
  created_at: string
  role: string
  call_count: number
  gesperrt: boolean | null
}

export default function UsersList({ isLoading: initialLoading }: { isLoading: boolean }) {
  const [users, setUsers] = useState<Profile[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(initialLoading)
  const [searchTerm, setSearchTerm] = useState('')
  const { toast } = useToast()

  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (profilesError) throw profilesError

      const usersWithCallCount = await Promise.all(profiles.map(async (profile) => {
        const { count, error: countError } = await supabase
          .from('calls')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profile.id)

        if (countError) {
          console.error(`Fehler beim Laden der Anrufzahl für Benutzer ${profile.id}:`, countError)
          return { ...profile, call_count: 0, gesperrt: profile.gesperrt }
        }

        return { ...profile, call_count: count || 0, gesperrt: profile.gesperrt }
      }))

      setUsers(usersWithCallCount)
      setError(null)
    } catch (error) {
      console.error('Fehler beim Laden der Benutzer:', error)
      setError('Fehler beim Laden der Benutzer. Bitte versuchen Sie es später erneut.')
      toast({
        id: "load-users-error",
        title: "Fehler",
        description: "Benutzer konnten nicht geladen werden.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleStatusChange = async (userId: string, currentStatus: string) => {
    try {
      if (currentStatus === 'pending') {
        // E-Mail-Verifizierung direkt hier implementiert
        const { error } = await supabase
          .from('profiles')
          .update({ 
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)

        if (error) {
          throw error
        }

        toast({
          id: "email-verification-success",
          title: "Erfolg",
          description: "Benutzerstatus geändert und E-Mail verifiziert.",
        })
      } else {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            status: 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)

        if (updateError) {
          throw updateError
        }
        toast({
          id: "status-change-success",
          title: "Erfolg",
          description: "Benutzerstatus erfolgreich auf 'Ausstehend' geändert",
        })
      }
      
      await loadUsers()
    } catch (error) {
      console.error('Status change error:', error)
      toast({
        id: "status-change-error",
        title: "Fehler",
        description: "Statusänderung fehlgeschlagen. Bitte versuchen Sie es später erneut.",
        variant: "destructive",
      })
    }
  }

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
    try {
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()

      if (updateError) {
        throw updateError
      }

      if (data && data.length > 0) {
        await loadUsers()
        toast({
          id: "role-change-success",
          title: "Erfolg",
          description: `Benutzerrolle erfolgreich auf ${newRole} geändert`,
        })
      } else {
        throw new Error('Keine Daten zurückgegeben')
      }
    } catch (error) {
      console.error('Role change error:', error)
      toast({
        id: "role-change-error",
        title: "Fehler",
        description: "Rollenänderung fehlgeschlagen. Bitte versuchen Sie es später erneut.",
        variant: "destructive",
      })
    }
  }

  const handleLockUser = async (userId: string, isLocked: boolean | null) => {
    try {
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({ 
          gesperrt: isLocked ? null : 'ja',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()

      if (updateError) {
        throw updateError
      }

      if (data && data.length > 0) {
        await loadUsers()
        toast({
          id: "lock-change-success",
          title: "Erfolg",
          description: isLocked ? "Benutzer entsperrt" : "Benutzer gesperrt",
        })
      } else {
        throw new Error('Keine Daten zurückgegeben')
      }
    } catch (error) {
      console.error('Lock change error:', error)
      toast({
        id: "lock-change-error",
        title: "Fehler",
        description: "Sperrung/Entsperrung fehlgeschlagen. Bitte versuchen Sie es später erneut.",
        variant: "destructive",
      })
    }
  }

  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.company_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-950 to-indigo-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-950 to-indigo-900 text-white">
        <AlertCircle className="h-8 w-8 mb-2" />
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="h-full w-full">
      <main className="p-6">
        <Card className="bg-white shadow-2xl border-blue-200/50">
          <CardHeader className="border-b border-blue-100/50 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="text-2xl font-bold text-blue-900 flex items-center">Benutzer verwalten</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="mb-6">
              <div className="relative">
                <Input 
                  placeholder="Suchen..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-blue-50 border-blue-200 text-blue-900 placeholder-blue-400"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-400" />
              </div>
            </div>
            {filteredUsers.length === 0 ? (
              <p className="text-center py-4 text-blue-600">Keine Benutzer gefunden</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.map((user) => (
                  <Card key={user.id} className="bg-white shadow-xl border-blue-200/50">
                    <CardContent className="p-6">
                      <div className="flex flex-col space-y-4">
                        <div className="flex items-center space-x-4">
                          <div className="bg-blue-600 rounded-full p-2">
                            <User className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-blue-900">{user.full_name}</h3>
                            <p className="text-sm text-blue-600">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-blue-700">
                          <Briefcase className="h-4 w-4" />
                          <span>{user.company_name || '-'}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-blue-700">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(user.created_at).toLocaleDateString('de-DE')}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <Shield className="h-4 w-4" />
                          <span className={user.role === 'admin' ? 'text-purple-600' : 'text-green-600'}>
                            {user.role === 'admin' ? 'Administrator' : 'Benutzer'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-blue-700">
                          <PhoneCall className="h-4 w-4" />
                          <span>{user.call_count} Anrufe</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            user.gesperrt
                              ? 'bg-red-100 text-red-800'
                              : user.status === 'active'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {user.gesperrt ? 'Gesperrt' : user.status === 'active' ? 'Aktiv' : 'Ausstehend'}
                          </span>
                        </div>
                        <div className="flex flex-col space-y-2 pt-4">
                          <Button
                            onClick={() => handleStatusChange(user.id, user.status)}
                            size="sm"
                            variant={user.status === 'active' ? 'destructive' : 'default'}
                            className={`w-full ${user.status === 'active' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} text-white transition-colors duration-200`}
                          >
                            {user.status === 'active' ? 'Deaktivieren' : 'Aktivieren'}
                          </Button>
                          <Button
                            onClick={() => handleRoleChange(user.id, user.role === 'admin' ? 'user' : 'admin')}
                            size="sm"
                            variant="outline"
                            className="w-full bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300 transition-colors duration-200"
                          >
                            {user.role === 'admin' ? 'Zum Benutzer' : 'Zum Admin'}
                          </Button>
                          <Button
                            onClick={() => handleLockUser(user.id, user.gesperrt)}
                            size="sm"
                            variant="outline"
                            className="w-full bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300 transition-colors duration-200"
                          >
                            {user.gesperrt ? 'Entsperren' : 'Sperren'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

