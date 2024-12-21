'use client'

import { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { PhoneCall, BarChart, Settings, Upload, TrendingUp, FileText, Building } from 'lucide-react'
import ProjectSetup from '../components/ProjectSetup'
import CallImport from '../components/CallImport'
import CallList from '../components/CallList'
import CallStats from '../components/CallStats'
import DailyOffer from '../components/DailyOffer'
import MonthlyBilling from '../components/MonthlyBilling'
import CompanySettings from '../components/CompanySettings'

export default function DashboardInhalt() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
    }
  }, [user, router])

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto p-4">
      <Tabs defaultValue="import" className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-7 gap-2">
          <TabsTrigger value="import" className="flex items-center justify-center">
            <Upload className="mr-2 h-4 w-4" />
            Anrufe importieren
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center justify-center">
            <PhoneCall className="mr-2 h-4 w-4" />
            Anrufliste
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center justify-center">
            <BarChart className="mr-2 h-4 w-4" />
            Statistiken
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center justify-center">
            <Settings className="mr-2 h-4 w-4" />
            Projekte einrichten
          </TabsTrigger>
          <TabsTrigger value="dailyoffer" className="flex items-center justify-center">
            <TrendingUp className="mr-2 h-4 w-4" />
            Tagesangebot
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center justify-center">
            <FileText className="mr-2 h-4 w-4" />
            Monatliche Abrechnung
          </TabsTrigger>
          <TabsTrigger value="company" className="flex items-center justify-center">
            <Building className="mr-2 h-4 w-4" />
            Firmendaten
          </TabsTrigger>
        </TabsList>
        <TabsContent value="import">
          <CallImport />
        </TabsContent>
        <TabsContent value="list">
          <CallList />
        </TabsContent>
        <TabsContent value="stats">
          <CallStats />
        </TabsContent>
        <TabsContent value="projects">
          <ProjectSetup />
        </TabsContent>
        <TabsContent value="dailyoffer">
          <DailyOffer />
        </TabsContent>
        <TabsContent value="billing">
          <MonthlyBilling />
        </TabsContent>
        <TabsContent value="company">
          <CompanySettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}

