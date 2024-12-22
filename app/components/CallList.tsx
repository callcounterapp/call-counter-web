'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { PhoneIncoming, PhoneOutgoing, PhoneMissed, Search, Trash2, PhoneOff } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useToast } from "./ui/use-toast"
import { useAuth } from '../contexts/AuthContext'

interface Call {
  id: number
  type: string
  name: string
  number: string
  formattedtime: string
  formattedduration: string
  info: string
  user_id: string
}

interface RawCall {
  id: number
  type: string
  name: string
  number: string
  formattedtime: string
  formattedduration: string
  info: string
  user_id: string
}

const CallList = () => {
  const [calls, setCalls] = useState<Call[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  const fetchCalls = useCallback(async () => {
    if (!user?.id) {
      setError('Bitte melden Sie sich an')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      if (!supabase) {
        throw new Error('Supabase-Client ist nicht initialisiert');
      }
      const { data, error: fetchError } = await supabase
        .from('calls')
        .select('*')
        .eq('user_id', user.id)
        .order('formattedtime', { ascending: false })

      if (fetchError) throw fetchError

      setCalls(((data || []) as unknown as RawCall[]).map((call): Call => ({
        id: call.id,
        type: call.type,
        name: call.name,
        number: call.number,
        formattedtime: call.formattedtime,
        formattedduration: call.formattedduration,
        info: call.info,
        user_id: call.user_id
      })))
    } catch (err) {
      console.error('Fehler in fetchCalls:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler beim Laden der Anrufe'
      setError(errorMessage)
      toast({
        title: "Fehler beim Laden",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [user, toast])

  useEffect(() => {
    fetchCalls()

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Seite wurde sichtbar, aktualisiere Daten...')
        fetchCalls()
      }
    }

    const handleFocus = () => {
      console.log('Fenster hat Fokus erhalten, aktualisiere Daten...')
      fetchCalls()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [fetchCalls])

  const handleRefresh = () => {
    fetchCalls()
  }

  const deleteCall = async (id: number) => {
    try {
      if (!supabase) {
        throw new Error('Supabase-Client ist nicht initialisiert');
      }
      const { error } = await supabase
        .from('calls')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      setCalls(calls.filter(call => call.id !== id))
      toast({
        title: "Erfolg",
        description: "Anruf wurde erfolgreich gelöscht.",
      })
    } catch (error) {
      console.error('Fehler beim Löschen des Anrufs:', error)
      toast({
        title: "Fehler",
        description: "Anruf konnte nicht gelöscht werden.",
        variant: "destructive",
      })
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
        return { color: 'text-green-500', icon: <PhoneIncoming className="inline mr-2" /> }
      case 'abgebrochen':
        return { color: 'text-red-500', icon: <PhoneOff className="inline mr-2" /> }
      case 'besetzt':
        return { color: 'text-yellow-500', icon: <PhoneMissed className="inline mr-2" /> }
      default:
        return { color: 'text-gray-500', icon: <PhoneIncoming className="inline mr-2" /> }
    }
  }

  if (!user?.id) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-red-500 mb-2">Bitte melden Sie sich an, um Ihre Anrufe zu sehen.</p>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              Erneut versuchen
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Anrufliste</CardTitle>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            {isLoading ? 'Lädt...' : 'Neu laden'}
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative flex-grow">
            <Input 
              placeholder="Suchen..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Nach Status filtern" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle</SelectItem>
              <SelectItem value="incoming">Eingehend</SelectItem>
              <SelectItem value="outgoing">Ausgehend</SelectItem>
              <SelectItem value="missed">Verpasst</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-center p-4">
            <p className="text-red-500 mb-2">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
            >
              Erneut versuchen
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Nummer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Datum & Zeit</TableHead>
                <TableHead>Dauer</TableHead>
                <TableHead>Info</TableHead>
                <TableHead>Aktion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    <div className="flex flex-col items-center gap-2">
                      <p>Verbindung wird hergestellt...</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleRefresh}
                        disabled={isLoading}
                      >
                        Abbrechen und neu laden
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : calls.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    Keine Anrufe gefunden
                  </TableCell>
                </TableRow>
              ) : (
                filteredCalls.map((call) => (
                  <TableRow key={call.id}>
                    <TableCell>{call.name}</TableCell>
                    <TableCell>{call.number}</TableCell>
                    <TableCell>
                      {getCallType(call.type) === 'incoming' && (
                        <span className="flex items-center">
                          <PhoneIncoming className="text-green-500 mr-2 h-5 w-5" />
                          Eingehend
                        </span>
                      )}
                      {getCallType(call.type) === 'outgoing' && (
                        <span className="flex items-center">
                          <PhoneOutgoing className="text-blue-500 mr-2 h-5 w-5" />
                          Ausgehend
                        </span>
                      )}
                      {getCallType(call.type) === 'missed' && (
                        <span className="flex items-center">
                          <PhoneMissed className="text-red-500 mr-2 h-5 w-5" />
                          Verpasst
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{call.formattedtime}</TableCell>
                    <TableCell>{call.formattedduration}</TableCell>
                    <TableCell>
                      {(() => {
                        const { color, icon } = getInfoStyle(call.info)
                        return (
                          <span className={`${color} flex items-center`}>
                            {icon}
                            {call.info}
                          </span>
                        )
                      })()}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="icon" onClick={() => deleteCall(call.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

export default CallList

