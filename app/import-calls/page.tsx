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

        if (newCallsCount === 0) {
          setImportStatus(`Import abgeschlossen. Alle ${calls.length} Anrufe sind bereits in der Datenbank vorhanden.`)
        } else {
          setImportStatus(`Import abgeschlossen. ${newCallsCount} neue Anrufe wurden importiert. ${calls.length - newCallsCount} Anrufe waren bereits in der Datenbank vorhanden.`)
        }
      } catch (error) {
        console.error('Fehler beim Importieren der Anrufe:', error)
        setImportStatus('Fehler beim Importieren der Anrufe.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-sm border-gray-700 shadow-xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-between mb-2">
            <Link 
              href="/dashboard" 
              className="text-blue-400 hover:text-blue-300 transition-colors duration-200 flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              <span className="text-xs font-medium">Zurück</span>
            </Link>
          </div>
          <CardTitle className="text-2xl font-bold text-center text-white">Anrufe importieren</CardTitle>
          <CardDescription className="text-center text-gray-400 text-sm">
            Laden Sie Ihre CSV-Datei mit Anrufdaten hoch
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => {e.preventDefault(); handleImport()}} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file-upload" className="sr-only">CSV-Datei auswählen</Label>
              <div className="flex items-center justify-center w-full">
                <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600 transition-colors duration-200">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-400"><span className="font-semibold">Klicken</span> oder Datei hierher ziehen</p>
                    <p className="text-xs text-gray-500">{fileName || 'CSV-Datei auswählen'}</p>
                  </div>
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-200 flex items-center justify-center"
              disabled={!file}
            >
              <Upload className="mr-2 h-4 w-4" />
              Importieren
            </Button>
          </form>
          {importStatus && (
            <div className="mt-4 p-3 rounded-lg bg-blue-500/20 border border-blue-500/30">
              <p className="text-xs text-white text-center">{importStatus}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

