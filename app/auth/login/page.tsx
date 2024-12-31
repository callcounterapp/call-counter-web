'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(''); // Vorherige Nachrichten löschen

    try {
      const { user, error } = await login(email, password);
      
      if (user) {
        console.log('Benutzer erfolgreich angemeldet:', user);
        router.push('/dashboard');
      } else if (error) {
        setMessage(error);
      }
    } catch (error) {
      console.error('Unerwarteter Login-Fehler:', error);
      setMessage('Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail)
    if (error) {
      setMessage('Fehler beim Zurücksetzen des Passworts: ' + error.message)
    } else {
      setMessage('Eine E-Mail zum Zurücksetzen des Passworts wurde gesendet.')
      setShowResetPassword(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 to-indigo-900 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/95 shadow-2xl border-blue-200/50 backdrop-blur-sm">
        <CardHeader className="space-y-1 border-b border-blue-100/50 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-2 mb-4">
            <Link 
              href="/" 
              className="text-blue-600 hover:text-blue-800 flex items-center gap-2 transition-colors duration-200"
            >
              <ArrowLeft size={20} />
              Zurück
            </Link>
          </div>
          <CardTitle className="text-2xl font-bold text-center text-blue-900">Anmelden</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {message && (
            <div className={`mb-4 p-3 rounded ${
              message.includes('wurde gesendet') 
                ? 'bg-green-100 border border-green-300 text-green-800'
                : 'bg-red-100 border border-red-300 text-red-800'
            }`}>
              {message}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-blue-900">E-Mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="max@mustermann.at"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-blue-50 border-blue-200 text-blue-900 placeholder:text-blue-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-blue-900">Passwort</Label>
              <Input
                id="password"
                type="password"
                placeholder="Passwort"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-blue-50 border-blue-200 text-blue-900"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
            >
              Anmelden
            </Button>
            <Button 
              type="button" 
              onClick={() => setShowResetPassword(true)}
              className="w-full mt-2 bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors duration-200"
            >
              Passwort zurücksetzen
            </Button>
          </form>
          
          <div className="mt-4 text-center text-sm text-blue-700">
            Noch kein Konto?{' '}
            <Link href="/auth/register" className="text-blue-600 hover:text-blue-800 transition-colors duration-200">
              Jetzt registrieren
            </Link>
          </div>
        </CardContent>
      </Card>
      {showResetPassword && (
        <div className="fixed inset-0 bg-blue-950/50 backdrop-blur-sm flex items-center justify-center">
          <Card className="w-full max-w-md bg-white/95 shadow-2xl border-blue-200/50 backdrop-blur-sm">
            <CardHeader className="border-b border-blue-100/50 bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="text-xl font-bold text-center text-blue-900">Passwort zurücksetzen</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resetEmail" className="text-blue-900">E-Mail</Label>
                  <Input
                    id="resetEmail"
                    type="email"
                    placeholder="max@mustermann.at"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    className="bg-blue-50 border-blue-200 text-blue-900 placeholder:text-blue-400"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
                >
                  Link senden
                </Button>
                <Button 
                  type="button" 
                  onClick={() => setShowResetPassword(false)}
                  className="w-full mt-2 bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors duration-200"
                >
                  Abbrechen
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

