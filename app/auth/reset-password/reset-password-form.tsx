'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type AuthError = {
  message: string;
}

export default function ResetPasswordForm() {
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    const urlToken = searchParams.get('token')
    if (urlToken) {
      setToken(urlToken)
    }

    // Apply global styles
    document.body.style.background = 'linear-gradient(to bottom right, #172554, #312e81)'
    document.body.style.margin = '0'
    document.body.style.padding = '0'
    document.body.style.minHeight = '100vh'

    // Cleanup function
    return () => {
      document.body.style.background = ''
      document.body.style.margin = ''
      document.body.style.padding = ''
      document.body.style.minHeight = ''
    }
  }, [searchParams])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!token) {
      setMessage('Kein gültiger Token gefunden. Bitte fordern Sie einen neuen Passwort-Reset-Link an.')
      return
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    try {
      // Zuerst den Token verifizieren
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'recovery'
      })

      if (verifyError) throw verifyError

      // Dann das Passwort aktualisieren
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) throw updateError

      setMessage('Passwort wurde erfolgreich zurückgesetzt.')
      setTimeout(() => router.push('/auth/login'), 2000)
    } catch (error) {
      const authError = error as AuthError
      setMessage('Fehler beim Zurücksetzen des Passworts: ' + authError.message)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur-md border border-blue-300/20">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-blue-100">Passwort zurücksetzen</CardTitle>
        </CardHeader>
        <CardContent>
          {message && (
            <div className={`mb-4 p-3 rounded ${
              message.includes('erfolgreich') 
                ? 'bg-green-500/20 border border-green-500/30 text-green-100'
                : 'bg-red-500/20 border border-red-500/30 text-red-100'
            }`}>
              {message}
            </div>
          )}
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-blue-100">Neues Passwort</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Neues Passwort eingeben"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="bg-white/20 border-blue-300/30 text-blue-100 placeholder:text-blue-300/50"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full shadow-lg transition-all duration-300"
            >
              Passwort zurücksetzen
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

