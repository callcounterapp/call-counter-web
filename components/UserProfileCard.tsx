'use client'

import { useEffect, useState } from 'react'
import { User, Mail, Building, Shield, ImageIcon, Calendar, Clock, ChevronDown, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createClient } from '@supabase/supabase-js'
import Image from 'next/image'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface DashboardInfo {
  id: number
  title: string
  content: string
  image_url: string | null
  created_at: string
}

interface UserProfileCardProps {
  user: {
    full_name: string
    email: string
    company_name: string
    role: string
    avatar_url?: string
  }
}

export function UserProfileCard({ user }: UserProfileCardProps) {
  const [dashboardInfos, setDashboardInfos] = useState<DashboardInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardInfos = async () => {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('dashboard_info')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3)

      if (!error && data) {
        setDashboardInfos(data)
      } else {
        console.error('Error fetching dashboard infos:', error)
        setDashboardInfos([])
      }
      setIsLoading(false)
    }

    fetchDashboardInfos()
  }, [])

  const isNew = (createdAt: string) => {
    return new Date().getTime() - new Date(createdAt).getTime() < 24 * 60 * 60 * 1000
  }


  return (
    <Card className="bg-white shadow-xl border-0 overflow-hidden rounded-xl">
      <CardHeader className="bg-gradient-to-r from-gray-100 to-gray-200 pb-16 pt-6 relative">
        <div className="flex items-center gap-4 z-10 relative">
          <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
            <AvatarImage src={user.avatar_url} alt={user.full_name} />
            <AvatarFallback className="bg-gray-300 text-gray-600">
              <User className="h-12 w-12" />
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-2xl font-bold text-gray-800 mb-1">{user.full_name}</CardTitle>
            <div className="flex items-center text-gray-600">
              <Building className="h-4 w-4 mr-1" />
              <p className="text-sm">{user.company_name || 'Kein Unternehmen angegeben'}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-6 py-8 -mt-12 relative z-20">
        <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <div className="flex items-center text-sm font-medium text-gray-500">
                <Mail className="h-4 w-4 mr-2 text-gray-500" />
                E-Mail
              </div>
              <p className="text-sm text-gray-700">{user.email}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center text-sm font-medium text-gray-500">
                <Shield className="h-4 w-4 mr-2 text-gray-500" />
                Rolle
              </div>
              <Badge 
                variant={user.role === 'admin' ? "default" : "secondary"} 
                className="mt-1"
              >
                {user.role === 'admin' ? 'Administrator' : 'Benutzer'}
              </Badge>
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <div className="text-center text-gray-500">
            <span className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></span>
            <p className="mt-2">Lade Dashboard-Informationen...</p>
          </div>
        ) : dashboardInfos.length > 0 ? (
          <div className="space-y-4">
            {dashboardInfos.map((info) => (
              <Collapsible
                key={info.id}
                className="bg-gray-50 rounded-lg overflow-hidden transition-all duration-300 ease-in-out"
              >
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-between text-gray-700 hover:bg-gray-100 relative overflow-hidden"
                  >
                    <span className="flex items-center">
                      {info.title}
                      {isNew(info.created_at) && (
                        <Badge variant="destructive" className="ml-2 animate-pulse">
                          Neu
                        </Badge>
                      )}
                    </span>
                    <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="p-4">
                  <div className="flex items-center text-xs text-gray-500 mb-3">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span className="mr-3">{new Date(info.created_at).toLocaleDateString()}</span>
                    <Clock className="h-3 w-3 mr-1" />
                    <span>{new Date(info.created_at).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex items-start space-x-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <div className="relative h-24 w-24 flex-shrink-0 cursor-pointer overflow-hidden rounded-md shadow-md transition-transform duration-300 ease-in-out hover:scale-105">
                          {info.image_url ? (
                            <Image 
                              src={info.image_url || "/placeholder.svg"}
                              alt={info.title}
                              layout="fill"
                              objectFit="cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <ImageIcon className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                            <ImageIcon className="h-6 w-6 text-white" />
                          </div>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[800px]">
                        <DialogTitle>{info.title}</DialogTitle>
                        <div className="relative w-full h-[60vh]">
                          {info.image_url ? (
                            <Image 
                              src={info.image_url || "/placeholder.svg"}
                              alt={info.title}
                              layout="fill"
                              objectFit="contain"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                              <ImageIcon className="h-16 w-16 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                    <p className="text-sm text-gray-700 flex-grow leading-relaxed">{info.content}</p>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Keine Dashboard-Informationen</AlertTitle>
            <AlertDescription>
              Aktuell sind keine Dashboard-Informationen verfügbar.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

