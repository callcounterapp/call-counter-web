'use client'

import { useState } from 'react'
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
  const token = searchParams.get('token')

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!token) {
      setMessage('Kein gültiger Token gefunden. Bitte fordern Sie einen neuen Passwort-Reset-Link an.')
      return
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    try {
      // First verify the token
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'recovery'
      })

      if (verifyError) throw verifyError

      // Then update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) throw updateError

      setMessage('Passwort wurde erfolgreich zurückgesetzt.')
      setTimeout(() => router.push('/auth/login'), 2000)
    } catch (error) {
      const authError = error as AuthError;
      setMessage('Fehler beim Zurücksetzen des Passworts: ' + authError.message)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-800/95 backdrop-blur-lg border-gray-700">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-white">Passwort zurücksetzen</CardTitle>
        </CardHeader>
        <CardContent>
          {message && (
            <div className={`mb-4 p-3 rounded ${
              message.includes('erfolgreich') 
                ? 'bg-green-500/10 border border-green-500/20 text-green-200'
                : 'bg-red-500/10 border border-red-500/20 text-red-200'
            }`}>
              {message}
            </div>
          )}
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-gray-200">Neues Passwort</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Neues Passwort eingeben"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="bg-gray-700/90 border-gray-600 text-white placeholder:text-gray-400"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Passwort zurücksetzen
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

