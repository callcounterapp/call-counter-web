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
import { Upload, LayoutDashboard } from 'lucide-react'
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
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState(0)

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

    setIsImporting(true)
    setProgress(0)
    setImportStatus('Import wird gestartet...')

    const reader = new FileReader()
    reader.onload = async (e) => {
      const content = e.target?.result as string
      const lines = content.split('\n')
      const calls: Call[] = []
      let newCallsCount = 0

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
        }
      })

      if (calls.length === 0) {
        setImportStatus('Keine gültigen Anrufe zum Importieren gefunden.')
        return
      }

      try {
        let processedCalls = 0
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
          
          processedCalls++
          const newProgress = Math.round((processedCalls / calls.length) * 100)
          if (newProgress > progress) {
            setProgress(newProgress)
            setImportStatus(`Import läuft... ${newProgress}% abgeschlossen`)
          }
        }

        if (newCallsCount === 0) {
          setImportStatus(`Import abgeschlossen. Alle ${calls.length} Anrufe sind bereits in der Datenbank vorhanden.`)
        } else {
          setImportStatus(`Import abgeschlossen. ${newCallsCount} neue Anrufe wurden importiert. ${calls.length - newCallsCount} Anrufe waren bereits in der Datenbank vorhanden.`)
        }
        setIsImporting(false)
      } catch (error) {
        console.error('Fehler beim Importieren der Anrufe:', error)
        setImportStatus('Fehler beim Importieren der Anrufe.')
        setIsImporting(false)
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 to-indigo-900">
      <header className="bg-blue-900/30 backdrop-blur-md shadow-lg border-b border-blue-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white tracking-tight">Anrufe importieren</h1>
          <Link href="/dashboard">
            <Button variant="outline" className="bg-blue-100/10 text-blue-100 hover:bg-blue-100/20 border-blue-300/30 backdrop-blur-sm transition-all duration-300">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col items-center justify-center">
        <Card className="w-full max-w-md bg-white/95 shadow-2xl border-blue-200/50 backdrop-blur-sm">
          <CardHeader className="space-y-1 border-b border-blue-100/50 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="text-2xl font-bold text-center text-blue-900">Anrufe importieren</CardTitle>
            <CardDescription className="text-center text-blue-600 text-sm">
              Laden Sie Ihre CSV-Datei mit Anrufdaten hoch
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={(e) => {e.preventDefault(); handleImport()}} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="file-upload" className="sr-only">CSV-Datei auswählen</Label>
                <div className="flex items-center justify-center w-full">
                  <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-blue-200 border-dashed rounded-lg cursor-pointer bg-blue-50 hover:bg-blue-100 transition-colors duration-200">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-3 text-blue-500" />
                      <p className="mb-2 text-sm text-blue-700"><span className="font-semibold">Klicken</span> oder Datei hierher ziehen</p>
                      <p className="text-xs text-blue-600">{fileName || 'CSV-Datei auswählen'}</p>
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
                disabled={!file || isImporting}
              >
                {isImporting ? (
                  <>
                    <span className="mr-2">Importiere...</span>
                    <span>{progress}%</span>
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Importieren
                  </>
                )}
              </Button>
            </form>
            {importStatus && (
              <div className="mt-4 p-3 rounded-lg bg-blue-100 border border-blue-300">
                <p className="text-xs text-blue-800 text-center">{importStatus}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

