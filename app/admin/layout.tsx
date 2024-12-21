'use client'

import { useAuth, AuthProvider } from '../contexts/AuthContext'
import { redirect } from 'next/navigation'

function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div>Laden...</div>
  }

  // Überprüfe ob der Benutzer ein Admin ist
  if (!user || user.role !== 'admin') {
    redirect('/')
  }

  return <>{children}</>
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AuthProvider>
  )
}

