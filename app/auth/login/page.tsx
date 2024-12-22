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

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-sm border-gray-800">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-4">
            <Link 
              href="/" 
              className="text-gray-300 hover:text-white flex items-center gap-2"
            >
              <ArrowLeft size={20} />
              Zurück
            </Link>
          </div>
          <CardTitle className="text-2xl font-bold text-center text-white">Anmelden</CardTitle>
        </CardHeader>
        <CardContent>
          {message && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-200 rounded">
              {message}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-200">E-Mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="max@mustermann.at"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/10 border-gray-700 text-white placeholder:text-gray-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-200">Passwort</Label>
              <Input
                id="password"
                type="password"
                placeholder="Passwort"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white/10 border-gray-700 text-white"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Anmelden
            </Button>
          </form>
          
          <div className="mt-4 text-center text-sm text-gray-300">
            Noch kein Konto?{' '}
            <Link href="/auth/register" className="text-blue-400 hover:text-blue-300">
              Jetzt registrieren
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

