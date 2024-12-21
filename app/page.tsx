import Link from 'next/link'
import { Button } from "./components/ui/button"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8">
          <h1 className="text-5xl font-bold text-white mb-4">
            Willkommen bei Call Tracker
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Verwalten Sie Ihre Anrufe effizient und professionell. 
            Tracken Sie Statistiken, erstellen Sie Berichte und optimieren Sie Ihre Kommunikation.
          </p>
          
          <div className="flex justify-center gap-4 mt-8">
            <Link href="/auth/login">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8">
                Anmelden
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button size="lg" variant="outline" className="text-lg px-8 text-white border-white hover:bg-white hover:text-gray-900">
                Registrieren
              </Button>
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-2">Anrufverwaltung</h3>
              <p className="text-gray-400">Importieren und verwalten Sie Ihre Anrufe einfach und übersichtlich.</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-2">Statistiken</h3>
              <p className="text-gray-400">Detaillierte Auswertungen und Berichte für Ihre Anrufdaten.</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-white mb-2">Abrechnung</h3>
              <p className="text-gray-400">Automatisierte Abrechnungen und Vergütungsmodelle.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

