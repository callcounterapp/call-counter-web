import Link from 'next/link'
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col items-center justify-center p-4">
      <main className="text-center">
        <h1 className="text-4xl font-bold text-white mb-6">
          Willkommen beim Call Counter
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          Verwalten Sie Ihre Anrufe effizient und einfach.
        </p>
        <div className="space-x-4">
          <Link href="/auth/login">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              Anmelden
            </Button>
          </Link>
          <Link href="/auth/register">
            <Button className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
              Registrieren
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}

