import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-4">404 - Seite nicht gefunden</h1>
      <p className="text-xl mb-8">Die angeforderte Seite konnte nicht gefunden werden.</p>
      <Link href="/" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
        Zurück zur Startseite
      </Link>
    </div>
  )
}

