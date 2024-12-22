'use client'

import { useState } from 'react'
import { Button } from "./ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Upload } from 'lucide-react'
import { supabase } from "@/lib/supabaseClient"
import type { SupabaseClient } from "@supabase/supabase-js"
import { useAuth } from '../contexts/AuthContext'

interface Call {
  id?: number
  type: string
  name: string
  number: string
  formattedtime: string
  formattedduration: string
  info: string
  user_id: string | null
}

const CallImport = () => {
  const { user } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState('')
  const [importStatus, setImportStatus] = useState<string>('')
  const [debugInfo, setDebugInfo] = useState<string>('')

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setFile(file)
      setFileName(file.name)
    } else {
      setFile(null)
      setFileName('')
    }
  }

  const validateCall = (call: Partial<Call>): call is Call => {
    return !!(call.type && call.name && call.number && call.formattedtime && call.formattedduration);
  }

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  const handleImport = async () => {
    if (!file) {
      setImportStatus('Bitte wählen Sie eine Datei aus.')
      return
    }

    const reader = new FileReader()
    reader.onload = async (e) => {
      const content = e.target?.result as string
      const lines = content.split('\n')
      const newCalls: Call[] = []
      let newCallsCount = 0
      let skippedCallsCount = 0
      let debugOutput = ''

      lines.slice(1).filter(line => line.trim()).forEach((line, index) => {
        const [type, name, number, timeStr, durationStr, info] = line.split(',').map(item => item?.trim() ?? '')
        
        const call: Partial<Call> = {
          type,
          name,
          number,
          formattedtime: formatTime(parseInt(timeStr)),
          formattedduration: formatDuration(parseInt(durationStr)),
          info: info || 'Anruf beendet',
          user_id: user?.id && user.id !== '00000000-0000-0000-0000-000000000000' ? user.id : null
        }
        
        debugOutput += `Zeile ${index + 2}: ${JSON.stringify(call)}\n`
        
        if (validateCall(call)) {
          newCalls.push(call as Call)
          newCallsCount++
          debugOutput += `  Gültig\n`
        } else {
          skippedCallsCount++
          debugOutput += `  Ungültig: ${JSON.stringify(call)}\n`
        }
      })

      setDebugInfo(debugOutput)

      if (newCalls.length === 0) {
        setImportStatus('Keine gültigen Anrufe zum Importieren gefunden.')
        return
      }

      try {
        console.log('Zu importierende Anrufe:', JSON.stringify(newCalls, null, 2))
        if (!supabase) {
          throw new Error('Supabase-Client ist nicht initialisiert');
        }
        const { data, error } = await supabase
          .from('calls')
          .insert(newCalls)

        if (error) {
          console.error('Supabase Fehler:', error)
          throw error
        }

        setImportStatus(`Erfolgreich ${newCallsCount} Anrufe importiert. ${skippedCallsCount} ungültige Einträge wurden übersprungen.`)
        console.log('Importierte Daten:', data)
      } catch (error) {
        console.error('Detaillierter Fehler beim Importieren der Anrufe:', error)
        setImportStatus(`Fehler beim Importieren der Anrufe: ${JSON.stringify(error)}`)
      }
    }
    reader.readAsText(file)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Anrufe importieren</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => {e.preventDefault(); handleImport()}}>
          <Label htmlFor="file">CSV-Datei auswählen</Label>
          <Input type="file" id="file" accept=".csv" onChange={handleFileChange} />
          {fileName && (
            <p>Ausgewählte Datei: {fileName}</p>
          )}
          <Button type="submit">
            <Upload className="h-4 w-4 mr-2" />
            Importieren
          </Button>
        </form>
        {importStatus && <p className="mt-2 text-sm">{importStatus}</p>}
        {debugInfo && (
          <div className="mt-4 p-4 bg-gray-100 rounded overflow-auto max-h-96">
            <h3 className="font-bold mb-2">Debug-Informationen:</h3>
            <pre className="whitespace-pre-wrap">{debugInfo}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default CallImport

