'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import PendingUsersList from '../components/admin/PendingUsersList'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface PendingUser {
  id: string
  email: string
  created_at: string
}

export default function AdminContent() {
  const { user } = useAuth()
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPendingUsers()
  }, [])

  const fetchPendingUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, created_at')
        .eq('status', 'pending')

      if (error) {
        throw error
      }

      setPendingUsers(data || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching pending users:', err)
      setError('Fehler beim Abrufen ausstehender Benutzer. Bitte versuchen Sie es später erneut.')
    }
  }

  const approveUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: 'active' })
        .eq('id', userId)

      if (error) {
        throw error
      }

      fetchPendingUsers()
    } catch (err) {
      console.error('Error approving user:', err)
      setError('Fehler beim Genehmigen des Benutzers. Bitte versuchen Sie es später erneut.')
    }
  }

  if (!user || user.role !== 'admin') {
    return null
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin-Bereich</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <PendingUsersList pendingUsers={pendingUsers} approveUser={approveUser} />
    </div>
  )
}

