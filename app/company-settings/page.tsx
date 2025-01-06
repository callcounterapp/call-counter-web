'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Building, LayoutDashboard, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { getFirmaDaten, updateFirmaDaten } from '@/utils/supabase-client'
import { useToast } from "@/components/ui/use-toast"

type FirmaDaten = {
  name: string
  strasse: string
  stadt: string
  plz: string
  telefon: string
  email: string
  webseite: string
}

export default function FirmaEinstellungen() {
  const [firmaDaten, setFirmaDaten] = useState<FirmaDaten>({
    name: '',
    strasse: '',
    stadt: '',
    plz: '',
    telefon: '',
    email: '',
    webseite: ''
  })
  const [gespeicherteDaten, setGespeicherteDaten] = useState<FirmaDaten | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    async function loadFirmaDaten() {
      if (user) {
        setIsLoading(true)
        const data = await getFirmaDaten(user.id)
        if (data) {
          setFirmaDaten(data)
          setGespeicherteDaten(data)
        } else {
          setFirmaDaten({
            name: '',
            strasse: '',
            stadt: '',
            plz: '',
            telefon: '',
            email: '',
            webseite: ''
          })
          setGespeicherteDaten(null)
        }
        setIsLoading(false)
      }
    }
    loadFirmaDaten()
  }, [user])

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleSpeichern = async () => {
    if (user) {
      setIsLoading(true)
      const updatedData = await updateFirmaDaten(user.id, firmaDaten)
      setIsLoading(false)
      if (updatedData) {
        setGespeicherteDaten(updatedData)
        toast({
          id: "success-toast",
          title: "Erfolg",
          description: "Firmendaten wurden erfolgreich gespeichert.",
          variant: "default",
        })
      } else {
        toast({
          id: "error-toast",
          title: "Fehler",
          description: "Firmendaten konnten nicht gespeichert werden.",
          variant: "destructive",
        })
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 to-indigo-900 flex items-center justify-center">
        <div className="bg-white/10 p-8 rounded-lg backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 to-indigo-900">
      <header className="bg-blue-900/30 backdrop-blur-md shadow-lg border-b border-blue-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white tracking-tight">Unternehmenseinstellungen</h1>
          <Link href="/dashboard">
            <Button variant="outline" className="bg-blue-100/10 text-blue-100 hover:bg-blue-100/20 border-blue-300/30 backdrop-blur-sm transition-all duration-300">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="w-full max-w-2xl mx-auto bg-white/95 shadow-2xl border-blue-200/50 backdrop-blur-sm mb-8">
          <CardHeader className="border-b border-blue-100/50 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="text-2xl font-bold flex items-center text-blue-900">
              <Building className="mr-2 h-6 w-6 text-blue-600" />
              Firmendaten
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label htmlFor="firma-name" className="text-blue-900">Firmenname</Label>
              <Input
                id="firma-name"
                value={firmaDaten.name}
                onChange={(e) => setFirmaDaten({ ...firmaDaten, name: e.target.value })}
                placeholder="Ihre Firma GmbH"
                className="bg-blue-50 border-blue-200 text-blue-900 placeholder-blue-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="strasse" className="text-blue-900">Straße und Hausnummer</Label>
              <Input
                id="strasse"
                value={firmaDaten.strasse}
                onChange={(e) => setFirmaDaten({ ...firmaDaten, strasse: e.target.value })}
                placeholder="Musterstraße 123"
                className="bg-blue-50 border-blue-200 text-blue-900 placeholder-blue-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="plz" className="text-blue-900">PLZ</Label>
                <Input
                  id="plz"
                  value={firmaDaten.plz}
                  onChange={(e) => setFirmaDaten({ ...firmaDaten, plz: e.target.value })}
                  placeholder="12345"
                  className="bg-blue-50 border-blue-200 text-blue-900 placeholder-blue-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stadt" className="text-blue-900">Stadt</Label>
                <Input
                  id="stadt"
                  value={firmaDaten.stadt}
                  onChange={(e) => setFirmaDaten({ ...firmaDaten, stadt: e.target.value })}
                  placeholder="Musterstadt"
                  className="bg-blue-50 border-blue-200 text-blue-900 placeholder-blue-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefon" className="text-blue-900">Telefon</Label>
              <Input
                id="telefon"
                value={firmaDaten.telefon}
                onChange={(e) => setFirmaDaten({ ...firmaDaten, telefon: e.target.value })}
                placeholder="+49 123 456789"
                className="bg-blue-50 border-blue-200 text-blue-900 placeholder-blue-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-blue-900">E-Mail</Label>
              <Input
                id="email"
                type="email"
                value={firmaDaten.email}
                onChange={(e) => setFirmaDaten({ ...firmaDaten, email: e.target.value })}
                placeholder="info@ihrefirma.de"
                className="bg-blue-50 border-blue-200 text-blue-900 placeholder-blue-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="webseite" className="text-blue-900">Webseite</Label>
              <Input
                id="webseite"
                value={firmaDaten.webseite}
                onChange={(e) => setFirmaDaten({ ...firmaDaten, webseite: e.target.value })}
                placeholder="www.ihrefirma.de"
                className="bg-blue-50 border-blue-200 text-blue-900 placeholder-blue-400"
              />
            </div>

            <Button 
              onClick={handleSpeichern} 
              className="w-full bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-300"
              disabled={isLoading}
            >
              {isLoading ? 'Wird gespeichert...' : 'Firmendaten speichern'}
            </Button>
          </CardContent>
        </Card>

        {gespeicherteDaten && (
          <Card className="w-full max-w-2xl mx-auto bg-white/95 shadow-2xl border-blue-200/50 backdrop-blur-sm mt-8">
            <CardHeader className="border-b border-blue-100/50 bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="text-2xl font-bold flex items-center text-blue-900">
                <Building className="mr-2 h-6 w-6 text-blue-600" />
                Gespeicherte Firmendaten
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div>
                  <Label className="text-blue-900 font-semibold">Name:</Label>
                  <p className="text-blue-800 mt-1">{gespeicherteDaten.name || 'Nicht angegeben'}</p>
                </div>
                <div>
                  <Label className="text-blue-900 font-semibold">Strasse:</Label>
                  <p className="text-blue-800 mt-1">{gespeicherteDaten.strasse || 'Nicht angegeben'}</p>
                </div>
                <div>
                  <Label className="text-blue-900 font-semibold">Stadt:</Label>
                  <p className="text-blue-800 mt-1">{gespeicherteDaten.stadt || 'Nicht angegeben'}</p>
                </div>
                <div>
                  <Label className="text-blue-900 font-semibold">PLZ:</Label>
                  <p className="text-blue-800 mt-1">{gespeicherteDaten.plz || 'Nicht angegeben'}</p>
                </div>
                <div>
                  <Label className="text-blue-900 font-semibold">Telefon:</Label>
                  <p className="text-blue-800 mt-1">{gespeicherteDaten.telefon || 'Nicht angegeben'}</p>
                </div>
                <div>
                  <Label className="text-blue-900 font-semibold">Email:</Label>
                  <p className="text-blue-800 mt-1">{gespeicherteDaten.email || 'Nicht angegeben'}</p>
                </div>
                <div>
                  <Label className="text-blue-900 font-semibold">Webseite:</Label>
                  <p className="text-blue-800 mt-1">{gespeicherteDaten.webseite || 'Nicht angegeben'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}

