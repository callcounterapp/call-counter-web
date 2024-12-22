export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h2 className="mb-4 text-2xl font-bold">404 - Seite nicht gefunden</h2>
      <p className="mb-4">Die angeforderte Seite konnte nicht gefunden werden.</p>
      <a 
        href="/"
        className="text-primary hover:text-primary/90 underline"
      >
        Zurück zur Startseite
      </a>
    </div>
  )
}

