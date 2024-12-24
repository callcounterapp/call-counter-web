'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { BarChart, LayoutDashboard, Info, Edit, Trash2, Plus } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from '@/contexts/AuthContext'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '../../types/supabase'

interface Project {
  id: string
  internal_name: string
  display_name: string
  payment_model: 'custom' | 'perMinute' | 'perCall'
  custom_rates: { minDuration: number; maxDuration: number; rate: number }[]
  min_duration: number
  per_minute_rate: number
  per_call_rate: number
  round_up_minutes: boolean
  user_id: string
}

export default function ManageProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const { user } = useAuth()
  const { toast } = useToast()
  const supabase = createClientComponentClient<Database>()

  const fetchProjects = useCallback(async () => {
    try {
      if (!user) {
        console.error('User is not authenticated')
        toast({
          id: 'fetch-projects-error',
          title: "Fehler",
          description: "Sie müssen angemeldet sein, um Projekte zu verwalten.",
          variant: "destructive",
        })
        return
      }

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
  
      if (error) throw error
    
      if (data && data.length > 0) {
        setProjects(data)
      } else {
        // Wenn keine Projekte gefunden wurden, laden wir die vordefinierten Projekte
        const predefinedProjects: Project[] = [
          {
            id: '442cfe7c-31f1-4af2-9ce0-5be5dec9d996',
            internal_name: 'Witt',
            display_name: 'Witt',
            payment_model: 'perCall',
            custom_rates: [{"rate":0,"maxDuration":0,"minDuration":0}],
            min_duration: 20,
            per_minute_rate: 0,
            per_call_rate: -37,
            round_up_minutes: false,
            user_id: '64bfd0ed-6a3d-422e-a6ef-5c9acb374218'
          },
          {
            id: '7c787497-3e08-427b-878d-4fdbb767129a',
            internal_name: 'Vgn',
            display_name: 'VGN',
            payment_model: 'perCall',
            custom_rates: [{"rate":0,"maxDuration":0,"minDuration":0}],
            min_duration: 20,
            per_minute_rate: 0,
            per_call_rate: 70,
            round_up_minutes: true,
            user_id: '64bfd0ed-6a3d-422e-a6ef-5c9acb374218'
          },
          // Fügen Sie hier die anderen Projekte aus Ihrem SQL-Insert hinzu
        ]
        setProjects(predefinedProjects)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
      toast({
        id: 'fetch-projects-error',
        title: "Error",
        description: "Fehler beim Laden der Projekte. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      })
    }
  }, [user, toast, supabase])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <header className="bg-gray-800/50 backdrop-blur-sm shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Projekte verwalten</h1>
          <Link href="/dashboard">
            <Button variant="outline" className="bg-white/10 text-white hover:bg-white/20 transition-colors duration-300">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="bg-white/10 backdrop-blur-sm border-gray-700">
          <CardHeader className="border-b border-gray-700">
            <CardTitle className="text-2xl font-bold text-white">Projekte einrichten und verwalten</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ProjectSetup projects={projects} setProjects={setProjects} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

function ProjectSetup({ projects, setProjects }: { projects: Project[], setProjects: React.Dispatch<React.SetStateAction<Project[]>> }) {
  const { user } = useAuth()
  const { toast } = useToast()
  const supabase = createClientComponentClient<Database>()
  const [newProject, setNewProject] = useState<Project>({
    id: '',
    internal_name: '',
    display_name: '',
    payment_model: 'custom',
    custom_rates: [{ minDuration: 0, maxDuration: 0, rate: 0 }],
    min_duration: 0,
    per_minute_rate: 0,
    per_call_rate: 0,
    round_up_minutes: true,
    user_id: user?.id || '',
  })
  const [editMode, setEditMode] = useState(false)

  const resetForm = () => {
    setNewProject({
      id: '',
      internal_name: '',
      display_name: '',
      payment_model: 'custom',
      custom_rates: [{ minDuration: 0, maxDuration: 0, rate: 0 }],
      min_duration: 0,
      per_minute_rate: 0,
      per_call_rate: 0,
      round_up_minutes: true,
      user_id: user?.id || '',
    })
    setEditMode(false)
  }

  const addOrUpdateProject = async () => {
    if (!user) {
      toast({
        id: 'project-auth-error',
        title: "Fehler",
        description: "Sie müssen angemeldet sein, um ein Projekt zu erstellen oder zu bearbeiten.",
        variant: "destructive",
      })
      return
    }

    if (!newProject.internal_name.trim() || !newProject.display_name.trim()) {
      toast({
        id: 'project-input-error',
        title: "Fehler",
        description: "Bitte geben Sie sowohl einen internen Namen als auch einen Anzeigenamen ein.",
        variant: "destructive",
      })
      return
    }

    const projectToSave = {
      ...newProject,
      custom_rates: newProject.custom_rates.map(rate => ({
        minDuration: rate.minDuration,
        maxDuration: rate.maxDuration,
        rate: Math.round(rate.rate * 100)
      })),
      per_minute_rate: Math.round(newProject.per_minute_rate * 100),
      per_call_rate: Math.round(newProject.per_call_rate * 100),
      user_id: user.id
    }

    try {
      let result
      if (editMode) {
        const { data, error } = await supabase
          .from('projects')
          .update(projectToSave)
          .eq('id', newProject.id)
          .eq('user_id', user.id)
          .select()
      
        if (error) throw error
        result = data?.[0]
      } else {
        const projectWithoutId = Object.fromEntries(
          Object.entries(projectToSave).filter(([key]) => key !== 'id')
        )
        const { data, error } = await supabase
          .from('projects')
          .insert([projectWithoutId])
          .select()
      
        if (error) throw error
        result = data?.[0]
      }

      if (result) {
        setProjects(prevProjects => {
          const updatedProjects = editMode
            ? prevProjects.map(p => p.id === result.id ? result : p)
            : [...prevProjects, result]
          return updatedProjects
        })
        resetForm()
        toast({
          id: 'project-success',
          title: "Erfolg",
          description: editMode ? 'Projekt erfolgreich aktualisiert.' : 'Projekt erfolgreich erstellt.',
        })
      } else {
        throw new Error('Keine Daten von der Datenbank zurückgegeben.')
      }
    } catch (error) {
      console.error('Error saving project:', error)
      let errorMessage = 'Unbekannter Fehler beim Speichern des Projekts.'
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'object' && error !== null) {
        errorMessage = JSON.stringify(error)
      }
      toast({
        id: 'project-save-error',
        title: "Fehler",
        description: `Fehler beim ${editMode ? 'Aktualisieren' : 'Erstellen'} des Projekts: ${errorMessage}`,
        variant: "destructive",
      })
    }
  }

  const editProject = (project: Project) => {
    setNewProject({
      ...project,
      custom_rates: project.custom_rates.map(rate => ({
        minDuration: rate.minDuration,
        maxDuration: rate.maxDuration,
        rate: rate.rate / 100
      })),
      per_minute_rate: project.per_minute_rate / 100,
      per_call_rate: project.per_call_rate / 100,
    })
    setEditMode(true)
  }

  const deleteProject = async (id: string) => {
    if (!user) {
      toast({
        id: 'delete-project-auth-error',
        title: "Fehler",
        description: "Sie müssen angemeldet sein, um ein Projekt zu löschen.",
        variant: "destructive",
      })
      return
    }

    if (window.confirm('Sind Sie sicher, dass Sie dieses Projekt löschen möchten?')) {
      try {
        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id)
        
        if (error) throw error
        
        setProjects(projects.filter(project => project.id !== id))
        toast({
          id: 'delete-project-success',
          title: "Erfolg",
          description: "Projekt erfolgreich gelöscht.",
        })
      } catch (error) {
        console.error('Error deleting project:', error)
        toast({
          id: 'delete-project-error',
          title: "Fehler",
          description: "Fehler beim Löschen des Projekts. Bitte versuchen Sie es erneut.",
          variant: "destructive",
        })
      }
    }
  }

  const addCustomRate = () => {
    setNewProject({
      ...newProject,
      custom_rates: [...newProject.custom_rates, { minDuration: 0, maxDuration: 0, rate: 0 }]
    })
  }

  const updateCustomRate = (index: number, field: keyof typeof newProject.custom_rates[0], value: number) => {
    const updatedRates = [...newProject.custom_rates]
    updatedRates[index] = { ...updatedRates[index], [field]: value }
    setNewProject({ ...newProject, custom_rates: updatedRates })
  }

  const removeCustomRate = (index: number) => {
    const updatedRates = newProject.custom_rates.filter((_, i) => i !== index)
    setNewProject({ ...newProject, custom_rates: updatedRates })
  }

  const formatCurrency = (amount: number): string => {
    const euros = Math.floor(amount / 100);
    const cents = amount % 100;
    return `${euros},${cents.toString().padStart(2, '0')} €`;
  }

  return (
    <div className="space-y-8">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-white">
            {editMode ? 'Projekt bearbeiten' : 'Projekt einrichten'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <Label htmlFor="internalName" className="text-white">Interner Projektname</Label>
              <Input
                id="internalName"
                value={newProject.internal_name}
                onChange={(e) => setNewProject({ ...newProject, internal_name: e.target.value })}
                placeholder="Internen Projektnamen eingeben (z.B. *50)"
                className="bg-gray-700 text-white border-gray-600"
              />
              <InfoText>
                Geben Sie hier den internen Namen des Projekts ein. Dieser wird für die Zuordnung und Berechnung verwendet.
              </InfoText>
            </div>
            <div>
              <Label htmlFor="displayName" className="text-white">Anzeigename des Projekts</Label>
              <Input
                id="displayName"
                value={newProject.display_name}
                onChange={(e) => setNewProject({ ...newProject, display_name: e.target.value })}
                placeholder="Anzeigenamen eingeben (z.B. ABCOutcall)"
                className="bg-gray-700 text-white border-gray-600"
              />
              <InfoText>
                Geben Sie hier den Anzeigenamen des Projekts ein. Dieser wird in Anruflisten und Statistiken angezeigt.
              </InfoText>
            </div>
            <div>
              <Label className="text-white">Vergütungsmodell</Label>
              <Select
                value={newProject.payment_model}
                onValueChange={(value) => setNewProject({ ...newProject, payment_model: value as 'custom' | 'perMinute' | 'perCall' })}
              >
                <SelectTrigger className="w-full mb-2 bg-gray-700 text-white border-gray-600">
                  <SelectValue placeholder="Wählen Sie ein Vergütungsmodell" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 text-white border-gray-700">
                  <SelectItem value="custom">Benutzerdefiniert</SelectItem>
                  <SelectItem value="perMinute">Pro Minute</SelectItem>
                  <SelectItem value="perCall">Pro Anruf</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center space-x-2 mt-4">
                <Checkbox
                  id="roundUpMinutes"
                  checked={newProject.round_up_minutes}
                  onCheckedChange={(checked) => setNewProject({ ...newProject, round_up_minutes: checked as boolean })}
                  className="bg-gray-700 border-gray-600"
                />
                <Label htmlFor="roundUpMinutes" className="text-white">Minuten aufrunden</Label>
              </div>
              <InfoText>
                Wenn aktiviert, werden angebrochene Minuten auf volle Minuten aufgerundet.
              </InfoText>
            </div>
            {newProject.payment_model === 'custom' && (
              <div>
                <Label className="text-white">Benutzerdefiniertes Vergütungsmodell</Label>
                <div className="space-y-2">
                  {newProject.custom_rates.map((rate, index) => (
                    <div key={index} className="flex space-x-2 items-end">
                      <div className="flex-1">
                        <Input
                          type="number"
                          value={rate.minDuration}
                          onChange={(e) => updateCustomRate(index, 'minDuration', Number(e.target.value))}
                          placeholder="Min. Dauer (Sek.)"
                          className="bg-gray-700 text-white border-gray-600"
                        />
                        <InfoText>Mindestdauer in Sekunden</InfoText>
                      </div>
                      <div className="flex-1">
                        <Input
                          type="number"
                          value={rate.maxDuration}
                          onChange={(e) => updateCustomRate(index, 'maxDuration', Number(e.target.value))}
                          placeholder="Max. Dauer (Sek.)"
                          className="bg-gray-700 text-white border-gray-600"
                        />
                        <InfoText>Maximaldauer in Sekunden</InfoText>
                      </div>
                      <div className="flex-1">
                        <Input
                          type="number"
                          value={rate.rate}
                          onChange={(e) => updateCustomRate(index, 'rate', Number(e.target.value))}
                          placeholder="Vergütung (Cent)"
                          className="bg-gray-700 text-white border-gray-600"
                        />
                        <InfoText>Vergütung in Cent (z.B. 40,50 für 40,50 Cent)</InfoText>
                      </div>
                      <Button onClick={() => removeCustomRate(index)} variant="outline" size="icon" className="bg-gray-700 text-white hover:bg-gray-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button onClick={addCustomRate} variant="outline" className="w-full bg-gray-700 text-white hover:bg-gray-600">
                    <Plus className="h-4 w-4 mr-2" /> Weitere Vergütungsstufe hinzufügen
                  </Button>
                </div>
                <InfoText>
                  Definieren Sie hier die Vergütungsstufen. Geben Sie die minimale und maximale
                  Anrufdauer in Sekunden und den entsprechenden Vergütungsbetrag in Cent ein.
                </InfoText>
              </div>
            )}
            {newProject.payment_model === 'perMinute' && (
              <div>
                <Label htmlFor="perMinuteRate" className="text-white">Vergütung pro Minute (in Cent)</Label>
                <Input
                  id="perMinuteRate"
                  type="number"
                  value={newProject.per_minute_rate}
                  onChange={(e) => setNewProject({ ...newProject, per_minute_rate: Number(e.target.value) })}
                  placeholder="Vergütung in Cent (z.B. 40,50 für 40,50 Cent)"
                  className="bg-gray-700 text-white border-gray-600"
                />
                <InfoText>
                  Geben Sie hier den Betrag in Cent ein, der pro Minute vergütet wird.
                </InfoText>
              </div>
            )}
            {newProject.payment_model === 'perCall' && (
              <div>
                <Label htmlFor="perCallRate" className="text-white">Vergütung pro Anruf (in Cent)</Label>
                <Input
                  id="perCallRate"
                  type="number"
                  value={newProject.per_call_rate}
                  onChange={(e) => setNewProject({ ...newProject, per_call_rate: Number(e.target.value) })}
                  placeholder="Vergütung in Cent (z.B. 40,50 für 40,50 Cent)"
                  className="bg-gray-700 text-white border-gray-600"
                />
                <InfoText>
                  Geben Sie hier den Betrag in Cent ein, der pro Anruf vergütet wird.
                </InfoText>
              </div>
            )}
            <div>
              <Label htmlFor="minDuration" className="text-white">Mindestdauer für Abrechnung (in Sekunden)</Label>
              <Input
                id="minDuration"
                type="number"
                value={newProject.min_duration}
                onChange={(e) => setNewProject({ ...newProject, min_duration: Number(e.target.value) })}
                className="bg-gray-700 text-white border-gray-600"
              />
              <InfoText>
                Geben Sie hier die Mindestdauer in Sekunden ein, ab der ein Anruf vergütet wird.
                Anrufe unter dieser Dauer werden nicht berechnet.
              </InfoText>
            </div>
            <Button onClick={addOrUpdateProject} className="bg-blue-600 hover:bg-blue-700 text-white">
              {editMode ? 'Projekt aktualisieren' : 'Projekt hinzufügen'}
            </Button>
            {editMode && (
              <Button onClick={resetForm} variant="outline" className="ml-2 bg-gray-700 text-white hover:bg-gray-600">
                Abbrechen
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-white">Vorhandene Projekte</CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="text-center text-gray-400">Keine Projekte vorhanden.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <Card key={project.id} className="bg-gray-700 shadow-md hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="bg-gray-800 border-b border-gray-600">
                    <CardTitle className="text-lg font-semibold flex justify-between items-center text-white">
                      <span>{project.display_name}</span>
                      <div className="flex space-x-2">
                        <Button onClick={() => editProject(project)} variant="ghost" size="sm" className="text-gray-300 hover:text-white">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => deleteProject(project.id)} variant="ghost" size="sm" className="text-gray-300 hover:text-white">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-3 text-gray-300">
                      <div className="bg-gray-800 p-3 rounded-md shadow-sm">
                        <h4 className="text-sm font-semibold mb-2 flex items-center text-white">
                          <BarChart className="h-4 w-4 mr-2 text-blue-500" />
                          Projektdetails
                        </h4>
                        <p className="text-sm">
                          <span className="font-medium">Interner Name:</span> {project.internal_name}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Anzeigename:</span> {project.display_name}
                        </p>
                        <p className="text-sm mt-2">
                          <span className="font-medium">Vergütungsmodell:</span> {' '}
                          {project.payment_model === 'custom' && 'Benutzerdefiniert'}
                          {project.payment_model === 'perMinute' && 'Pro Minute'}
                          {project.payment_model === 'perCall' && 'Pro Anruf'}
                        </p>
                        <p className="text-sm mt-2">
                          <span className="font-medium">Minuten aufrunden:</span> {project.round_up_minutes ? 'Ja' : 'Nein'}
                        </p>
                        {project.payment_model === 'custom' && (
                          <p className="text-sm mt-1">
                            <span className="font-medium">Vergütungsstufen:</span> {project.custom_rates.length}
                          </p>
                        )}
                        {project.payment_model === 'perMinute' && (
                          <p className="text-sm mt-1">
                            <span className="font-medium">Vergütung pro Minute:</span> {formatCurrency(project.per_minute_rate)}
                          </p>
                        )}
                        {project.payment_model === 'perCall' && (
                          <p className="text-sm mt-1">
                            <span className="font-medium">Vergütung pro Anruf:</span> {formatCurrency(project.per_call_rate)}
                          </p>
                        )}
                      </div>
                      <div className="bg-gray-800 p-3 rounded-md shadow-sm">
                        <p className="text-sm">
                          <span className="font-medium">Mindestdauer:</span> {project.min_duration} Sek.
                        </p>
                      </div>
                      {project.payment_model === 'custom' && (
                        <div className="bg-gray-800 p-3 rounded-md shadow-sm">
                          <h4 className="text-sm font-semibold mb-2 flex items-center text-white">
                            <BarChart className="h-4 w-4 mr-2 text-green-500" />
                            Vergütungsübersicht
                          </h4>
                          <div className="space-y-1">
                            {project.custom_rates.map((rate, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span>{rate.minDuration}-{rate.maxDuration} Sek.</span>
                                <span className="font-medium">{formatCurrency(rate.rate)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function InfoText({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start mt-2 mb-4 text-sm text-gray-400">
      <Info className="mr-1 h-4 w-4 text-blue-400 flex-shrink-0" />
      <p className="flex-1">{children}</p>
    </div>
  )
}

