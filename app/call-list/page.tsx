'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PhoneIncoming, PhoneOutgoing, PhoneMissed, Search, Trash2, PhoneOff, Calendar, LayoutDashboard, Check, X } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from '@/contexts/AuthContext'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Call {
  id: number
  type: string
  name: string
  number: string
  formattedtime: string
  formattedduration: string
  info: string
  created_at: string
}

interface ToastProps {
  id: string;
  title: string;
  description: string;
  variant?: 'default' | 'destructive';
}

const CallList = () => {
  const [calls, setCalls] = useState<Call[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedMonth, setSelectedMonth] = useState('')
  const [availableMonths, setAvailableMonths] = useState<{value: string, label: string}[]>([])
  const { toast } = useToast()
  const { user } = useAuth()

  const fetchCalls = useCallback(async () => {
    try {
      if (!user) {
        setCalls([])
        return
      }
      const { data, error } = await supabase
        .from('calls')
        .select('*')
        .eq('user_id', user.id)
      
      if (error) throw error
      
      setCalls(data || [])
    } catch (error) {
      console.error('Error fetching calls:', error)
      toast({
        id: "fetch-error",
        title: "Fehler",
        description: "Anrufe konnten nicht geladen werden.",
        variant: "destructive",
      } as ToastProps)
    }
  }, [user, toast])

  useEffect(() => {
    fetchCalls()
  }, [fetchCalls])

  useEffect(() => {
    if (calls.length > 0) {
      const months = getMonthsWithCalls(calls)
      setAvailableMonths(months)
    }
  }, [calls])

  const deleteCall = async (id: number) => {
    try {
      const { error } = await supabase
        .from('calls')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      setCalls(calls.filter(call => call.id !== id))
      toast({
        id: "delete-success",
        title: "Erfolg",
        description: "Anruf wurde erfolgreich gelöscht.",
      } as ToastProps)
    } catch (error) {
      console.error('Error deleting call:', error)
      toast({
        id: "delete-error",
        title: "Fehler",
        description: "Anruf konnte nicht gelöscht werden.",
        variant: "destructive",
      } as ToastProps)
    }
  }

  const deleteAllCalls = async () => {
    try {
      const { error } = await supabase
        .from('calls')
        .delete()
        .eq('user_id', user?.id)
      
      if (error) throw error
      
      setCalls([])
      setAvailableMonths([])
      toast({
        id: "delete-all-success",
        title: "Erfolg",
        description: "Alle Anrufe wurden erfolgreich gelöscht.",
      } as ToastProps)
    } catch (error) {
      console.error('Error deleting all calls:', error)
      toast({
        id: "delete-all-error",
        title: "Fehler",
        description: "Anrufe konnten nicht gelöscht werden.",
        variant: "destructive",
      } as ToastProps)
    }
  }

  const deleteCallsByMonth = async (month: string) => {
    try {
      const [year, month_num] = month.split('-')
      const monthStart = new Date(parseInt(year), parseInt(month_num) - 1, 1)
      const monthEnd = new Date(parseInt(year), parseInt(month_num), 0)

      const callsToDelete = calls.filter(call => {
        const callDate = new Date(call.formattedtime.split(',')[0].split('.').reverse().join('-'))
        return callDate >= monthStart && callDate <= monthEnd
      })

      if (callsToDelete.length === 0) {
        toast({
          id: "no-calls-found",
          title: "Information",
          description: `Keine Anrufe für ${new Date(monthStart).toLocaleString('de-DE', { month: 'long', year: 'numeric' })} gefunden.`,
        } as ToastProps)
        return
      }

      const { error } = await supabase
        .from('calls')
        .delete()
        .in('id', callsToDelete.map(call => call.id))

      if (error) throw error

      await fetchCalls()
      toast({
        id: "delete-by-month-success",
        title: "Erfolg",
        description: `${callsToDelete.length} Anrufe für ${new Date(monthStart).toLocaleString('de-DE', { month: 'long', year: 'numeric' })} wurden gelöscht.`,
      } as ToastProps)
    } catch (error) {
      console.error('Error deleting calls by month:', error)
      toast({
        id: "delete-by-month-error",
        title: "Fehler",
        description: "Anrufe konnten nicht gelöscht werden.",
        variant: "destructive",
      } as ToastProps)
    }
  }

  const getCallType = (type: string) => {
    const typeLower = type.toLowerCase()
    if (typeLower.includes('in')) return 'incoming'
    if (typeLower.includes('out')) return 'outgoing'
    if (typeLower.includes('miss')) return 'missed'
    return type
  }

  const filteredCalls = calls.filter(call => {
    const searchTermLower = searchTerm.toLowerCase()
    const callType = getCallType(call.type)
    
    return (
      call.name.toLowerCase().includes(searchTermLower) ||
      call.number.toLowerCase().includes(searchTermLower) ||
      callType.includes(searchTermLower)
    )
  }).filter(call => {
    if (selectedStatus === 'all') return true
    return getCallType(call.type) === selectedStatus
  })

  const getInfoStyle = (info: string) => {
    switch (info.toLowerCase()) {
      case 'anruf beendet':
        return { color: 'text-green-400', icon: <Check className="inline mr-1 h-3 w-3" /> }
      case 'abgebrochen':
        return { color: 'text-red-400', icon: <X className="inline mr-1 h-3 w-3" /> }
      case 'besetzt':
        return { color: 'text-yellow-400', icon: <PhoneOff className="inline mr-1 h-3 w-3" /> }
      default:
        return { color: 'text-gray-400', icon: null }
    }
  }

  const getMonthsWithCalls = (calls: Call[]) => {
    const months = new Set<string>()
    calls.forEach(call => {
      const date = new Date(call.formattedtime.split(',')[0].split('.').reverse().join('-'))
      if (!isNaN(date.getTime())) {
        const monthValue = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        months.add(monthValue)
      }
    })
  
    return Array.from(months)
      .map(month => {
        const [year, month_num] = month.split('-')
        const date = new Date(parseInt(year), parseInt(month_num) - 1, 1)
        return {
          value: month,
          label: date.toLocaleString('de-DE', { month: 'long', year: 'numeric' })
        }
      })
      .sort((a, b) => b.value.localeCompare(a.value))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <header className="bg-gray-800/50 backdrop-blur-sm shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Anrufliste</h1>
          <Link href="/dashboard">
            <Button variant="outline" className="bg-white/10 text-white hover:bg-white/20 transition-colors duration-300">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="bg-white/10 backdrop-blur-sm border-gray-700 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white">Anrufe verwalten</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-grow">
                <Input 
                  placeholder="Suchen..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white/5 border-gray-700 text-white placeholder-gray-400"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-[180px] bg-white/5 border-gray-700 text-white">
                  <SelectValue placeholder="Nach Status filtern" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 text-white border-gray-700">
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="incoming">Eingehend</SelectItem>
                  <SelectItem value="outgoing">Ausgehend</SelectItem>
                  <SelectItem value="missed">Verpasst</SelectItem>
                </SelectContent>
              </Select>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="bg-white/10 text-white hover:bg-white/20 transition-colors duration-300" disabled={availableMonths.length === 0}>
                    <Calendar className="mr-2 h-4 w-4" />
                    Nach Monat löschen
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-gray-800 text-white border-gray-700">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Anrufe nach Monat löschen</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-400">
                      Wählen Sie den Monat aus, für den Sie alle Anrufe löschen möchten.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-full bg-white/5 border-gray-700 text-white mt-4">
                      <SelectValue placeholder="Monat auswählen" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 text-white border-gray-700">
                      {availableMonths.map(month => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600">Abbrechen</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => selectedMonth && deleteCallsByMonth(selectedMonth)}
                      disabled={!selectedMonth}
                      className="bg-red-600 text-white hover:bg-red-700"
                    >
                      Löschen
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="bg-red-600 hover:bg-red-700 text-white transition-colors duration-300" disabled={calls.length === 0}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Alle löschen
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-gray-800 text-white border-gray-700">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Alle Anrufe löschen</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-400">
                      Sind Sie sicher, dass Sie alle Anrufe löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600">Abbrechen</AlertDialogCancel>
                    <AlertDialogAction onClick={deleteAllCalls} className="bg-red-600 text-white hover:bg-red-700">
                      Alle löschen
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <div className="overflow-x-auto rounded-lg border border-gray-700">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-gray-700">
                    <TableHead className="text-white">Name</TableHead>
                    <TableHead className="text-white">Nummer</TableHead>
                    <TableHead className="text-white">Status</TableHead>
                    <TableHead className="text-white">Datum & Zeit</TableHead>
                    <TableHead className="text-white">Dauer</TableHead>
                    <TableHead className="text-white">Info</TableHead>
                    <TableHead className="text-white">Aktion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCalls.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2 text-gray-400">
                          <PhoneOff className="h-8 w-8 opacity-50" />
                          <p>Keine Anrufe gefunden</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCalls.map((call) => (
                      <TableRow key={call.id} className="border-b border-gray-700">
                        <TableCell className="text-white">{call.name}</TableCell>
                        <TableCell className="text-white">{call.number}</TableCell>
                        <TableCell>
                          {getCallType(call.type) === 'incoming' && (
                            <span className="flex items-center text-green-400">
                              <PhoneIncoming className="mr-2 h-4 w-4" />
                              Eingehend
                            </span>
                          )}
                          {getCallType(call.type) === 'outgoing' && (
                            <span className="flex items-center text-blue-400">
                              <PhoneOutgoing className="mr-2 h-4 w-4" />
                              Ausgehend
                            </span>
                          )}
                          {getCallType(call.type) === 'missed' && (
                            <span className="flex items-center text-red-400">
                              <PhoneMissed className="mr-2 h-4 w-4" />
                              Verpasst
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-white">{call.formattedtime}</TableCell>
                        <TableCell className="text-white">{call.formattedduration}</TableCell>
                        <TableCell>
                          <span className={`${getInfoStyle(call.info).color} text-sm flex items-center`}>
                            {getInfoStyle(call.info).icon}
                            {call.info}
                          </span>
                        </TableCell>
                        <TableCell>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="icon" className="bg-white/10 text-white hover:bg-white/20">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-gray-800 text-white border-gray-700">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Sind Sie sicher?</AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-400">
                                  Diese Aktion kann nicht rückgängig gemacht werden. Der Anruf wird dauerhaft aus der Datenbank gelöscht.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600">Abbrechen</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteCall(call.id)} className="bg-red-600 text-white hover:bg-red-700">
                                  Löschen
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default CallList

