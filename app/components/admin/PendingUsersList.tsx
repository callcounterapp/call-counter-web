'use client'

import React from 'react';
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { UserCircle, CheckCircle, XCircle, PlayCircle, PauseCircle, Bell, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Profile {
  id: string
  email: string
  full_name: string
  company_name: string
  status: string
  created_at: string
  role: string
}

// Funktion zum Übersetzen der Status-Werte
const getStatusDisplay = (status: string) => {
  switch (status) {
    case 'active':
      return 'Aktiv'
    case 'rejected':
      return 'Deaktiviert'
    case 'pending':
      return 'Ausstehend'
    default:
      return status
  }
}

interface NotificationProps {
  message: string
  type: 'success' | 'error' | 'info'
}

const NotificationStyles = () => (
  <style jsx global>{`
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-50px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `}</style>
)

const Notification: React.FC<NotificationProps> = ({ message, type }) => {
  return (
    <div
      className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg ${
        type === 'success' ? 'bg-green-500' :
        type === 'error' ? 'bg-red-500' :
        'bg-blue-500'
      } text-white transition-all duration-300 ease-in-out z-50`}
      style={{
        opacity: 1,
        transform: 'translateY(0)',
        animation: 'slideIn 0.3s ease-out'
      }}
    >
      <div className="flex items-center">
        <Bell className="mr-2" />
        <span>{message}</span>
      </div>
    </div>
  )
}

export default function UsersList() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [notification, setNotification] = useState<NotificationProps | null>(null)
  const router = useRouter()

  const loadUsers = useCallback(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading users:', error)
      showNotification('Fehler beim Laden der Benutzer', 'error')
      return
    }

    setUsers(data || [])
    setLoading(false)
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 5000)
  }

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) throw updateError

      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, status: newStatus }
          : user
      ))

      showNotification(`Benutzerstatus erfolgreich auf ${getStatusDisplay(newStatus)} geändert`, 'success')

    } catch (error) {
      console.error('Status change error:', error)
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Ein unbekannter Fehler ist aufgetreten'
      showNotification(`Fehler bei der Statusänderung: ${errorMessage}`, 'error')
    }
  }

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) throw updateError

      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, role: newRole }
          : user
      ))
      
      showNotification(`Benutzerrolle erfolgreich auf ${newRole} geändert`, 'success')

    } catch (error) {
      console.error('Rolle change error:', error)
      showNotification(`Fehler bei der Rollenänderung: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`, 'error')
    }
  }

  const RoleSelector = ({ userId, currentRole }: { userId: string, currentRole: string }) => {
    const roles = ['user', 'admin']
    return (
      <select
        value={currentRole}
        onChange={(e) => handleRoleChange(userId, e.target.value)}
        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
      >
        {roles.map((role) => (
          <option key={role} value={role}>
            {role}
          </option>
        ))}
      </select>
    )
  }

  if (loading) {
    return <div>Lade Benutzeranfragen...</div>
  }

  return (
    <div className="space-y-4">
      <NotificationStyles />
      {notification && <Notification {...notification} />}
      <div className="bg-white shadow-md rounded-lg mb-6">
        <div className="px-6 py-4 flex justify-between items-center">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Zurück
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Admin Bereich - Benutzerliste</h1>
          <div className="w-24"></div> {/* Spacer for alignment */}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 bg-white shadow-md rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">E-Mail</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Firma</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rolle</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aktionen</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <UserCircle className="h-5 w-5 text-gray-400 mr-2" />
                    <span>{user.full_name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.company_name}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.status === 'active' ? 'bg-green-100 text-green-800' :
                    user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    user.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {getStatusDisplay(user.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <RoleSelector userId={user.id} currentRole={user.role} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(user.created_at).toLocaleDateString('de-DE')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap space-x-2">
                  {user.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(user.id, 'active')}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Freigeben
                      </button>
                      <button
                        onClick={() => handleStatusChange(user.id, 'rejected')}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Ablehnen
                      </button>
                    </>
                  )}
                  {user.status === 'rejected' && (
                    <button
                      onClick={() => handleStatusChange(user.id, 'active')}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <PlayCircle className="h-4 w-4 mr-1" />
                      Aktivieren
                    </button>
                  )}
                  {user.status === 'active' && (
                    <button
                      onClick={() => handleStatusChange(user.id, 'rejected')}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                    >
                      <PauseCircle className="h-4 w-4 mr-1" />
                      Deaktivieren
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {users.length === 0 && (
        <p className="text-center py-4">Keine Benutzer gefunden</p>
      )}
    </div>
  )
}

