'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, User, Briefcase, Calendar, Shield, PhoneCall, AlertCircle } from 'lucide-react'
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
}

export default function UsersList({ isLoading }: { isLoading: boolean }) {
  const [users, setUsers] = useState<Profile[]>([])
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      // Lade alle Benutzerprofile
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (profilesError) throw profilesError

      // Lade die Anrufzahlen für jeden Benutzer
      const usersWithCallCount = await Promise.all(profiles.map(async (profile) => {
        const { count, error: countError } = await supabase
          .from('calls')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profile.id)

        if (countError) {
          console.error(`Fehler beim Laden der Anrufzahl für Benutzer ${profile.id}:`, countError)
          return { ...profile, call_count: 0 }
        }

        return { ...profile, call_count: count || 0 }
      }))

      setUsers(usersWithCallCount)
      setError(null)
    } catch (error) {
      console.error('Fehler beim Laden der Benutzer:', error)
      setError('Fehler beim Laden der Benutzer. Bitte versuchen Sie es später erneut.')
      toast({
        title: "Fehler",
        description: "Benutzer konnten nicht geladen werden.",
        variant: "destructive",
      })
    }
  }

  const handleStatusChange = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'pending' : 'active'
    try {
      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({ 
          status: newStatus,
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
          title: "Erfolg",
          description: `Benutzerstatus erfolgreich auf ${newStatus} geändert`,
        })
      } else {
        throw new Error('Keine Daten zurückgegeben')
      }
    } catch (error) {
      console.error('Status change error:', error)
      toast({
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
          title: "Erfolg",
          description: `Benutzerrolle erfolgreich auf ${newRole} geändert`,
        })
      } else {
        throw new Error('Keine Daten zurückgegeben')
      }
    } catch (error) {
      console.error('Role change error:', error)
      toast({
        title: "Fehler",
        description: "Rollenänderung fehlgeschlagen. Bitte versuchen Sie es später erneut.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] text-red-400">
        <AlertCircle className="h-8 w-8 mb-2" />
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {users.length === 0 ? (
        <p className="text-center py-4 text-gray-400"></p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <Card key={user.id} className="bg-gray-800 border-gray-700 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-500 rounded-full p-2">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-100">{user.full_name}</h3>
                      <p className="text-sm text-gray-400">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <Briefcase className="h-4 w-4" />
                    <span>{user.company_name || 'Keine Firma angegeben'}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(user.created_at).toLocaleDateString('de-DE')}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Shield className="h-4 w-4" />
                    <span className={user.role === 'admin' ? 'text-purple-400' : 'text-green-400'}>
                      {user.role === 'admin' ? 'Administrator' : 'Benutzer'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <PhoneCall className="h-4 w-4" />
                    <span>{user.call_count} Anrufe</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.status === 'active' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {user.status === 'active' ? 'Aktiv' : 'Ausstehend'}
                    </span>
                  </div>
                  <div className="flex space-x-2 pt-4">
                    <Button
                      onClick={() => handleStatusChange(user.id, user.status)}
                      size="sm"
                      variant={user.status === 'active' ? 'destructive' : 'default'}
                      className="flex-1"
                    >
                      {user.status === 'active' ? 'Deaktivieren' : 'Aktivieren'}
                    </Button>
                    <Button
                      onClick={() => handleRoleChange(user.id, user.role === 'admin' ? 'user' : 'admin')}
                      size="sm"
                      variant="outline"
                      className="flex-1"
                    >
                      {user.role === 'admin' ? 'Zum Benutzer' : 'Zum Admin'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

