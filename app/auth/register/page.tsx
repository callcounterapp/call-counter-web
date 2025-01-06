'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const { register } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (password !== confirmPassword) {
      setError('Die Passwörter stimmen nicht überein.')
      return
    }

    try {
      const { error, message } = await register(email, password, name, company)
      if (error) {
        setError(message)
      } else {
        setSuccess('Registrierung erfolgreich. Bitte bestätigen Sie Ihre E-Mail-Adresse, indem Sie auf den Bestätigungslink in der E-Mail klicken, die wir Ihnen gesendet haben')
        setTimeout(() => {
          router.push('/auth/login')
        }, 2000)
      }
    } catch (error) {
      console.error('Registration error:', error)
      setError('Registrierung fehlgeschlagen. Bitte versuchen Sie es später erneut.')
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
          <CardTitle className="text-2xl font-bold text-center text-blue-900">Registrieren</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-800 rounded">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-800 rounded">
              {success}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-blue-900">E-Mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="ihre@email.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-blue-50 border-blue-200 text-blue-900 placeholder:text-blue-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-blue-900">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Ihr Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-blue-50 border-blue-200 text-blue-900 placeholder:text-blue-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company" className="text-blue-900">Benutzername</Label>
              <Input
                id="company"
                type="text"
                placeholder="Aukb"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
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
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-blue-900">Passwort bestätigen</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Passwort wiederholen"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-blue-50 border-blue-200 text-blue-900"
              />
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200">
              Registrieren
            </Button>
          </form>
          
          <div className="mt-4 text-center text-sm text-blue-700">
            Bereits registriert?{' '}
            <Link href="/auth/login" className="text-blue-600 hover:text-blue-800 transition-colors duration-200">
              Jetzt anmelden
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

