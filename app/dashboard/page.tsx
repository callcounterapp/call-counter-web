'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { LogOut, PhoneIncoming, List, FolderOpen, BarChart2, Users, ArrowRight, Settings, Loader2 } from 'lucide-react'
import { UserProfileCard } from '@/components/UserProfileCard'

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      try {
        setIsLoading(true)
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
  }, [user, router])

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
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-950 to-indigo-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
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

  menuItems.push({ title: 'Monatliche Abrechnung', icon: BarChart2, href: '/monthly-billing', description: 'Sehen Sie Ihre monatliche Abrechnung ein.' })
  menuItems.push({ title: 'Unternehmenseinstellungen', icon: Settings, href: '/company-settings', description: 'Verwalten Sie die Einstellungen Ihres Unternehmens.' })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 to-indigo-900">
      <header className="bg-blue-900/30 backdrop-blur-md shadow-lg border-b border-blue-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
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
        <div className="mb-12">
          <UserProfileCard user={{
            full_name: user.full_name || '',
            email: user.email || '',
            company_name: user.company_name || '',
            role: user.role || ''
          }} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {menuItems.map((item, index) => (
            <Link href={item.href} key={index} className="group">
              <Card className="bg-white/95 shadow-lg border-blue-200/50 backdrop-blur-sm hover:bg-blue-50 transition-all duration-300 h-full flex flex-col justify-between group-hover:scale-105 group-hover:shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-b border-blue-100/50">
                  <CardTitle className="text-xl font-medium text-blue-900 group-hover:text-blue-700 transition-colors">{item.title}</CardTitle>
                  <item.icon className="h-8 w-8 text-blue-600 group-hover:text-blue-700 transition-colors" />
                </CardHeader>
                <CardContent className="flex-grow pt-4">
                  <p className="text-sm text-blue-700">{item.description}</p>
                </CardContent>
                <CardContent className="pt-4 pb-2">
                  <div className="flex items-center text-sm text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="mr-2">Öffnen</span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        <footer className="mt-12 text-center text-sm text-blue-300">
          &copy; {new Date().getFullYear()} Jimmy Wilhelmer. Alle Rechte vorbehalten.
        </footer>
      </main>
    </div>
  )
}

