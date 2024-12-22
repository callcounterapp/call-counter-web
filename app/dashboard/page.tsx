'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { LogOut, PhoneIncoming, List, FolderOpen, BarChart2, Users, ArrowRight } from 'lucide-react'

export default function DashboardPage() {
  const { user, logout, refreshSession } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      try {
        setIsLoading(true)
        if (refreshSession) {
          await refreshSession()
        }
        if (!user) {
          console.log('No valid session found, redirecting to login')
          router.push('/auth/login')
        } else {
          setIsAdmin(user.role === 'admin')
        }
        setIsLoading(false)
      } catch (error) {
        console.error('Error checking session:', error)
        router.push('/auth/login')
      }
    }

    checkSession()
    const intervalId = setInterval(checkSession, 30000)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkSession()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      clearInterval(intervalId)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user, router, refreshSession])

  const handleLogout = async () => {
    if (isLoggingOut) return
    
    try {
      setIsLoggingOut(true)
      await logout()
      router.push('/auth/login')
    } catch (error) {
      console.error('Fehler beim Abmelden:', error)
      router.push('/auth/login')
    } finally {
      setIsLoggingOut(false)
    }
  }

  if (!user || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-white">Lade...</div>
      </div>
    )
  }

  const menuItems = [
    { title: 'Anrufe importieren', icon: PhoneIncoming, href: '/import-calls', description: 'Importieren Sie neue Anrufdaten in das System.' },
    { title: 'Anrufliste', icon: List, href: '/call-list', description: 'Sehen Sie sich alle importierten Anrufe an.' },
    { title: 'Projekte verwalten', icon: FolderOpen, href: '/manage-projects', description: 'Verwalten Sie Ihre laufenden Projekte.' },
    { title: 'Monatliche Statistik', icon: BarChart2, href: '/monthly-stats', description: 'Analysieren Sie Ihre monatlichen Leistungsdaten.' },
  ]

  if (isAdmin) {
    menuItems.push({ title: 'Benutzerverwaltung', icon: Users, href: '/admin/users', description: 'Verwalten Sie Benutzerkonten und Berechtigungen.' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <header className="bg-gray-800/50 backdrop-blur-sm shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <Button 
            onClick={handleLogout}
            variant="destructive"
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-300"
            disabled={isLoggingOut}
          >
            <LogOut className="mr-2 h-5 w-5" /> 
            {isLoggingOut ? 'Wird abgemeldet...' : 'Abmelden'}
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="bg-white/10 backdrop-blur-sm border-gray-700 mb-12">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-white">Willkommen zurück, {user.full_name || 'Benutzer'}!</CardTitle>
            <CardDescription>
              <div className="text-sm text-gray-300 mt-2">
                <div className="mb-1">E-Mail: {user.email}</div>
                <div className="mb-1">Unternehmen: {user.company_name || 'Nicht angegeben'}</div>
                <div>Status: {user.role || 'Nicht angegeben'}</div>
              </div>
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {menuItems.map((item, index) => (
            <Link href={item.href} key={index} className="group">
              <Card className="bg-white/10 backdrop-blur-sm border-gray-700 hover:bg-white/20 transition-all duration-300 h-full flex flex-col justify-between group-hover:scale-105 group-hover:shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xl font-medium text-white group-hover:text-blue-400 transition-colors">{item.title}</CardTitle>
                  <item.icon className="h-8 w-8 text-gray-300 group-hover:text-blue-400 transition-colors" />
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-sm text-gray-400">{item.description}</p>
                </CardContent>
                <CardContent className="pt-4 pb-2">
                  <div className="flex items-center text-sm text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="mr-2">Öffnen</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}

