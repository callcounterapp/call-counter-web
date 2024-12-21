'use client'

import { useState, useEffect } from 'react'
import { Button } from "./components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs"
import { Input } from "./components/ui/input"
import { Label } from "./components/ui/label"
import ProjectSetup from './components/ProjectSetup'
import CallImport from './components/CallImport'
import CallList from './components/CallList'
import CallStats from './components/CallStats'
import DailyOffer from './components/DailyOffer'
import MonthlyBilling from './components/MonthlyBilling'
import CompanySettings from './components/CompanySettings'
import { PhoneCall, BarChart, Settings, Upload, TrendingUp, FileText, Building, LogOut } from 'lucide-react'
import { AuthProvider, useAuth } from './contexts/AuthContext'

function CallTracker() {
  const [projects, setProjects] = useState([])
  const [calls, setCalls] = useState([])
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('')
  const [registerFullName, setRegisterFullName] = useState('')
  const [registerCompanyName, setRegisterCompanyName] = useState('')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { user, login, register, logout } = useAuth()

  useEffect(() => {
    const storedProjects = localStorage.getItem('projects')
    const storedCalls = localStorage.getItem('calls')
    if (storedProjects) setProjects(JSON.parse(storedProjects))
    if (storedCalls) setCalls(JSON.parse(storedCalls))
  }, [])

  useEffect(() => {
    localStorage.setItem('projects', JSON.stringify(projects))
  }, [projects])

  useEffect(() => {
    localStorage.setItem('calls', JSON.stringify(calls))
  }, [calls])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)
    try {
      await login(loginEmail, loginPassword)
    } catch (error) {
      console.error('Anmeldefehler:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Ein unerwarteter Fehler ist aufgetreten')
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)
    if (registerPassword !== registerConfirmPassword) {
      setErrorMessage('Passwörter stimmen nicht überein')
      return
    }
    try {
      const result = await register(
        registerEmail, 
        registerPassword, 
        registerFullName,
        registerCompanyName
      )
      setSuccessMessage(result.message)
      setRegisterEmail('')
      setRegisterPassword('')
      setRegisterConfirmPassword('')
      setRegisterFullName('')
      setRegisterCompanyName('')
    } catch (error) {
      console.error('Registrierungsfehler:', error)
      setErrorMessage(error instanceof Error ? error.message : 'Ein unerwarteter Fehler ist aufgetreten')
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      setSuccessMessage('Sie wurden erfolgreich abgemeldet.')
    } catch (error) {
      console.error('Abmeldefehler:', error)
      setErrorMessage('Fehler beim Abmelden. Bitte versuchen Sie es später erneut.')
    }
  }

  if (!user) {
    return (
      <div className="container mx-auto p-4 max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6">Call Tracker</h1>
        <Card>
          <CardHeader>
            <CardTitle>Willkommen</CardTitle>
          </CardHeader>
          <CardContent>
            {errorMessage && <p className="text-red-500 text-sm mb-4">{errorMessage}</p>}
            {successMessage && <p className="text-green-500 text-sm mb-4">{successMessage}</p>}
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Anmelden</TabsTrigger>
                <TabsTrigger value="register">Registrieren</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="loginEmail">E-Mail</Label>
                    <Input
                      id="loginEmail"
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="loginPassword">Passwort</Label>
                    <Input
                      id="loginPassword"
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">Anmelden</Button>
                </form>
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
                    <Label htmlFor="registerFullName">Name</Label>
                    <Input
                      id="registerFullName"
                      type="text"
                      value={registerFullName}
                      onChange={(e) => setRegisterFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="registerCompanyName">Firmenname</Label>
                    <Input
                      id="registerCompanyName"
                      type="text"
                      value={registerCompanyName}
                      onChange={(e) => setRegisterCompanyName(e.target.value)}
                      required
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

  if (user.status === 'pending') {
    return (
      <div className="container mx-auto p-4 max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6">Call Tracker</h1>
        <Card>
          <CardHeader>
            <CardTitle>Konto ausstehend</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center">
              Ihr Konto wurde noch nicht freigeschaltet. Bitte warten Sie auf die Bestätigung durch einen Administrator.
            </p>
            <Button onClick={handleLogout} className="w-full mt-4">Abmelden</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">Call Tracker</h1>
        <div className="flex gap-2">
          {user.role === 'admin' && (
            <Button variant="outline" onClick={() => window.location.href = '/admin'}>
              <Settings className="mr-2 h-4 w-4" />
              Admin
            </Button>
          )}
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Abmelden
          </Button>
        </div>
      </div>
      <Tabs defaultValue="import" className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-7 gap-2">
          <TabsTrigger value="import" className="flex items-center justify-center">
            <Upload className="mr-2 h-4 w-4" />
            Anrufe importieren
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center justify-center">
            <PhoneCall className="mr-2 h-4 w-4" />
            Anrufliste
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center justify-center">
            <BarChart className="mr-2 h-4 w-4" />
            Statistiken
          </TabsTrigger>
          <TabsTrigger value="projects" className="flex items-center justify-center">
            <Settings className="mr-2 h-4 w-4" />
            Projekte einrichten
          </TabsTrigger>
          <TabsTrigger value="dailyoffer" className="flex items-center justify-center">
            <TrendingUp className="mr-2 h-4 w-4" />
            Tagesangebot
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center justify-center">
            <FileText className="mr-2 h-4 w-4" />
            Monatliche Abrechnung
          </TabsTrigger>
          <TabsTrigger value="company" className="flex items-center justify-center">
            <Building className="mr-2 h-4 w-4" />
            Firmendaten
          </TabsTrigger>
        </TabsList>
        <TabsContent value="import">
          <CallImport calls={calls} setCalls={setCalls} />
        </TabsContent>
        <TabsContent value="list">
          <CallList calls={calls} projects={projects} setCalls={setCalls} />
        </TabsContent>
        <TabsContent value="stats">
          <CallStats calls={calls} projects={projects} />
        </TabsContent>
        <TabsContent value="projects">
          <ProjectSetup projects={projects} setProjects={setProjects} />
        </TabsContent>
        <TabsContent value="dailyoffer">
          <DailyOffer />
        </TabsContent>
        <TabsContent value="billing">
          <MonthlyBilling calls={calls} projects={projects} />
        </TabsContent>
        <TabsContent value="company">
          <CompanySettings />
        </TabsContent>
      </Tabs>
      <footer className="mt-8 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Jimmy Wilhelmer. Alle Rechte vorbehalten.
      </footer>
    </div>
  )
}

export default function Home() {
  return (
    <AuthProvider>
      <CallTracker />
    </AuthProvider>
  )
}

