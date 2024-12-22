'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { LogOut, PhoneIncoming, List, FolderOpen, BarChart2 } from 'lucide-react'

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
    }
  }, [user, router])

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/auth/login')
    } catch (error) {
      console.error('Fehler beim Abmelden:', error)
    }
  }

  if (!user) {
    return null // oder eine Lade-Animation
  }

  const menuItems = [
    { title: 'Anrufe importieren', icon: PhoneIncoming, href: '/import-calls' },
    { title: 'Anrufliste', icon: List, href: '/call-list' },
    { title: 'Projekte verwalten', icon: FolderOpen, href: '/manage-projects' },
    { title: 'Monatliche Statistik', icon: BarChart2, href: '/monthly-stats' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <header className="bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <Button 
            onClick={handleLogout}
            variant="ghost"
            className="text-white hover:bg-gray-700"
          >
            <LogOut className="mr-2 h-4 w-4" /> Abmelden
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="bg-white/10 backdrop-blur-sm border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white">Willkommen zurück, {user.email}!</CardTitle>
            <CardDescription className="text-gray-300">
              Name: {user.name || 'Nicht angegeben'} | Firma: {user.company || 'Nicht angegeben'}
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {menuItems.map((item, index) => (
            <Link href={item.href} key={index}>
              <Card className="bg-white/10 backdrop-blur-sm border-gray-700 hover:bg-white/20 transition-colors cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium text-white">{item.title}</CardTitle>
                  <item.icon className="h-5 w-5 text-gray-300" />
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-400">Klicken Sie hier, um {item.title.toLowerCase()}.</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}

