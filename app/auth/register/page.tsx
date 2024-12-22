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
      const result = await register(email, password, name, company)
      setSuccess(result.message)
      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)
    } catch (error) {
      console.error('Registration error:', error)
      setError('Registrierung fehlgeschlagen. Bitte versuchen Sie es später erneut.')
    }
  }

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
          <CardTitle className="text-2xl font-bold text-center text-white">Registrieren</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-200 rounded">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 text-green-200 rounded">
              {success}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-200">E-Mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="ihre@email.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/10 border-gray-700 text-white placeholder:text-gray-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-200">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Ihr Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-white/10 border-gray-700 text-white placeholder:text-gray-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company" className="text-gray-200">Firmenname</Label>
              <Input
                id="company"
                type="text"
                placeholder="Ihre Firma"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
                className="bg-white/10 border-gray-700 text-white placeholder:text-gray-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-200">Passwort</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white/10 border-gray-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-200">Passwort bestätigen</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-white/10 border-gray-700 text-white"
              />
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
              Registrieren
            </Button>
          </form>
          
          <div className="mt-4 text-center text-sm text-gray-300">
            Bereits registriert?{' '}
            <Link href="/auth/login" className="text-blue-400 hover:text-blue-300">
              Jetzt anmelden
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

