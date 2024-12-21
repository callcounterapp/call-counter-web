'use client'

import { useState } from 'react'
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import LoginForm from './LoginForm'

export default function AuthPage() {
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('')
  const [registerName, setRegisterName] = useState('')

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    if (registerPassword !== registerConfirmPassword) {
      alert('Passwörter stimmen nicht überein')
      return
    }
    // Hier würde die Registrierungslogik implementiert werden
    console.log('Registrierung mit:', registerEmail, registerName, registerPassword)
  }

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-3xl font-bold text-center mb-6">Call Tracker</h1>
      <Card>
        <CardHeader>
          <CardTitle>Willkommen</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Anmelden</TabsTrigger>
              <TabsTrigger value="register">Registrieren</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <LoginForm />
            </TabsContent>
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <Label htmlFor="registerEmail">E-Mail</Label>
                  <Input
                    id="registerEmail"
                    type="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="registerName">Name</Label>
                  <Input
                    id="registerName"
                    type="text"
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    required
                    className="border-4 border-red-500"
                  />
                </div>
                <div>
                  <Label htmlFor="registerPassword">Passwort</Label>
                  <Input
                    id="registerPassword"
                    type="password"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="registerConfirmPassword">Passwort bestätigen</Label>
                  <Input
                    id="registerConfirmPassword"
                    type="password"
                    value={registerConfirmPassword}
                    onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">Registrieren</Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

