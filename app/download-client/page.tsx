"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, ArrowLeft, AlertCircle, HelpCircle } from "lucide-react"
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"
import Image from "next/image"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function DownloadClientPage() {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showGuide, setShowGuide] = useState(false)

  useEffect(() => {
    const fetchDownloadUrl = async () => {
      try {
        const { data } = await supabase.storage
          .from("call-counter-client")
          .getPublicUrl("Call Counter Client Setup 1.0.0.exe")

        if (data) {
          console.log("Öffentliche URL erfolgreich abgerufen:", data.publicUrl)
          setDownloadUrl(data.publicUrl)
        } else {
          console.error("Keine Daten zurückgegeben")
          setError("Keine Download-URL verfügbar.")
        }
      } catch (error: unknown) {
        console.error("Detaillierter Fehler:", error)
        setError(
          `Fehler beim Abrufen der Download-URL: ${error instanceof Error ? error.message : "Unbekannter Fehler"}`,
        )
      } finally {
        setIsLoading(false)
      }
    }

    fetchDownloadUrl()
  }, [])

  const handleDownload = () => {
    if (downloadUrl) {
      console.log("Starte Download von:", downloadUrl)
      window.location.href = downloadUrl
    }
  }

  const UserGuide = () => (
    <div className="mt-8 space-y-8">
      <h2 className="text-2xl font-bold text-blue-900">Anleitung: Call Counter Client</h2>

      <section>
        <h3 className="text-xl font-semibold mb-2 text-blue-800">1. Anmelden</h3>
        <Image
          src="/bild1.png"
          alt="Anrufdaten importieren"
          width={400}
          height={200}
          className="mb-2 rounded-lg shadow-md"
        />
        <ol className="list-decimal list-inside">
          <li>Melden Sie sich mit Ihren Benutzerdaten auf www.call-counter.de an.</li>
          <li>Geben Sie im Popup-Fenster den korrekten Pfad ein und klicken Sie auf "Speichern".</li>
        </ol>
      </section>

      <section>
        <h3 className="text-xl font-semibold mb-2 text-blue-800">2. Pfad anpassen</h3>
        <Image src="/bild2.png" alt="Pfad anpassen" width={400} height={200} className="mb-2 rounded-lg shadow-md" />
        <ol className="list-decimal list-inside">
          <li>
            Nachdem Sie sich erfolgreich angemeldet haben, klicken Sie auf "Pfad ändern", um den Pfad zur
            InteliaPhone.ini-Datei festzulegen.
          </li>
          <li>
            Für gewöhnlich befindet sich die Datei unter dem folgenden Pfad:
            "C:\Users\Dein_Benuitzername\AppData\Roaming\InteliaPhone\InteliaPhone.ini
          </li>
          <li>Klicken Sie abschließend auf "Importieren", um den Importvorgang zu starten.</li>
        </ol>
      </section>

      <section>
        <h3 className="text-xl font-semibold mb-2 text-blue-800">3. Automatischer Import</h3>
        <Image
          src="/bild3.png"
          alt="Status überprüfen"
          width={400}
          height={200}
          className="mb-2 rounded-lg shadow-md"
        />
        <ul className="list-disc list-inside">
          <li>
            Geben Sie im Feld den gewünschten Intervall in Minuten ein, z. B. 60, und aktivieren Sie das Kästchen bei
            "Auto Import starten
          </li>
          <li>Nun wird alle 60 Minuten ein automatischer Importvorgang Ihrer Calls durchgeführt</li>
        </ul>
      </section>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 to-indigo-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl bg-white/95 shadow-lg border-blue-200/50 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-blue-900">Call Counter Client herunterladen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p className="text-center text-gray-600">Lade Download-Link...</p>
          ) : error ? (
            <div className="text-center text-red-600 flex items-center justify-center">
              <AlertCircle className="mr-2 h-5 w-5" />
              <p>{error}</p>
            </div>
          ) : (
            <>
              <p className="text-center text-gray-600">
                Klicken Sie auf den Button unten, um die neueste Version des Call Counter Clients herunterzuladen.
              </p>
              <div className="flex justify-center space-x-4">
                <Button
                  onClick={handleDownload}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-300 flex items-center"
                >
                  <Download className="mr-2 h-5 w-5" />
                  Herunterladen
                </Button>
                <Button
                  onClick={() => setShowGuide(!showGuide)}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-colors duration-300 flex items-center"
                >
                  <HelpCircle className="mr-2 h-5 w-5" />
                  {showGuide ? "Anleitung ausblenden" : "Anleitung anzeigen"}
                </Button>
              </div>
            </>
          )}
          {showGuide && <UserGuide />}
          <div className="text-center mt-4">
            <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 flex items-center justify-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zum Dashboard
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

