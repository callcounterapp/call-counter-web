'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Upload } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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

export default function ImportCallsPage() {
  const { user } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState('')
  const [importStatus, setImportStatus] = useState<string>('')
  

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
      const calls: Call[] = []
      let newCallsCount = 0
      let skippedCallsCount = 0

      lines.slice(1).filter(line => line.trim()).forEach((line) => {
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
        
        if (validateCall(call)) {
          calls.push(call as Call)
        } else {
          skippedCallsCount++
        }
      })

      if (calls.length === 0) {
        setImportStatus('Keine gültigen Anrufe zum Importieren gefunden.')
        return
      }

      try {
        for (const call of calls) {
          const { data: existingCalls, error: checkError } = await supabase
            .from('calls')
            .select()
            .eq('type', call.type)
            .eq('name', call.name)
            .eq('number', call.number)
            .eq('formattedtime', call.formattedtime)

          if (checkError) {
            console.error('Fehler beim Überprüfen existierender Anrufe:', checkError)
            continue
          }

          if (existingCalls && existingCalls.length === 0) {
            const { error: insertError } = await supabase
              .from('calls')
              .insert([call])

            if (insertError) {
              console.error('Fehler beim Einfügen des Anrufs:', insertError)
            } else {
              newCallsCount++
            }
          }
        }

        setImportStatus(`Import abgeschlossen. ${newCallsCount} neue Anrufe importiert. ${skippedCallsCount} ungültige Einträge wurden übersprungen.`)
      } catch (error) {
        console.error('Fehler beim Importieren der Anrufe:', error)
        setImportStatus('Fehler beim Importieren der Anrufe.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white/10 backdrop-blur-sm border-gray-800">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-4">
            <Link 
              href="/dashboard" 
              className="text-gray-300 hover:text-white flex items-center gap-2"
            >
              <ArrowLeft size={20} />
              Zurück zum Dashboard
            </Link>
          </div>
          <CardTitle className="text-2xl font-bold text-center text-white">Anrufe importieren</CardTitle>
          <CardDescription className="text-center text-gray-400">
            Laden Sie Ihre CSV-Datei mit Anrufdaten hoch
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => {e.preventDefault(); handleImport()}} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file-upload" className="text-gray-200">CSV-Datei auswählen</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="bg-white/10 border-gray-700 text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            {fileName && (
              <p className="text-sm text-gray-300">Ausgewählte Datei: {fileName}</p>
            )}
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center"
              disabled={!file}
            >
              <Upload className="mr-2 h-4 w-4" />
              Importieren
            </Button>
          </form>
          {importStatus && (
            <div className="mt-4 p-3 rounded bg-blue-500/20 border border-blue-500/20">
              <p className="text-sm text-white text-center">{importStatus}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

