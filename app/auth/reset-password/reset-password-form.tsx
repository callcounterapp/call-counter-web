'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()

  useEffect(() => {
    const handlePasswordReset = async () => {
      const access_token = searchParams.get('access_token')
      const refresh_token = searchParams.get('refresh_token')
      
      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({
          access_token,
          refresh_token
        })
        
        if (error) {
          setMessage('Fehler bei der Authentifizierung. Bitte versuchen Sie es erneut.')
          router.push('/auth/login')
        }
      }
    }

    handlePasswordReset()
  }, [searchParams, router, supabase.auth])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const { error } = await supabase.auth.updateUser({ 
      password: password 
    })

    if (error) {
      setMessage('Fehler beim Zurücksetzen des Passworts: ' + error.message)
    } else {
      setMessage('Passwort wurde erfolgreich zurückgesetzt.')
      setTimeout(() => router.push('/auth/login'), 2000)
    }
  }

  return (
    <Card className="w-full max-w-md bg-gray-800/95 backdrop-blur-lg border-gray-700">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center text-white">Neues Passwort festlegen</CardTitle>
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
            <Label htmlFor="password" className="text-gray-200">Neues Passwort</Label>
            <Input
              id="password"
              type="password"
              placeholder="Neues Passwort eingeben"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-gray-700/90 border-gray-600 text-white placeholder:text-gray-400"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Passwort ändern
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

