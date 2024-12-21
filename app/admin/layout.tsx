'use client'

import { useAuth, AuthProvider } from '../contexts/AuthContext'
import { redirect } from 'next/navigation'
import { useEffect } from 'react'

function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      redirect('/')
    }
  }, [user, loading])

  if (loading) {
    return <div>Laden...</div>
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

