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
  const supabase = createClientComponentClient<Database>()

  const fetchProjects = useCallback(async () => {
    try {
      if (!user) {
        console.error('Benutzer ist nicht authentifiziert')
        return
      }

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
  
      if (error) throw error
    
      if (data) {
        setProjects(data)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Projekte:', error)
    }
  }, [user, supabase])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 to-indigo-900">
      <header className="bg-blue-900/30 backdrop-blur-md shadow-lg border-b border-blue-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white tracking-tight">Projekte verwalten</h1>
          <Link href="/dashboard">
            <Button variant="outline" className="bg-blue-100/10 text-blue-100 hover:bg-blue-100/20 border-blue-300/30 backdrop-blur-sm transition-all duration-300">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="bg-white/95 shadow-2xl border-blue-200/50 backdrop-blur-sm">
          <CardHeader className="border-b border-blue-100/50 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="text-2xl font-bold text-blue-900">Projekte einrichten und verwalten</CardTitle>
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
      console.error('Benutzer ist nicht authentifiziert')
      return
    }

    if (!newProject.internal_name.trim() || !newProject.display_name.trim()) {
      console.error('Bitte geben Sie sowohl einen internen Namen als auch einen Anzeigenamen ein.')
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
        console.log(editMode ? 'Projekt erfolgreich aktualisiert.' : 'Projekt erfolgreich erstellt.')
      } else {
        throw new Error('Keine Daten von der Datenbank zurückgegeben.')
      }
    } catch (error) {
      console.error('Fehler beim Speichern des Projekts:', error)
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
      console.error('Benutzer ist nicht authentifiziert')
      return
    }

    const confirmed = await new Promise<boolean>((resolve) => {
      const dialog = document.createElement('div')
      dialog.innerHTML = `
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div class="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h2 class="text-lg mb-4 text-blue-900">Sind Sie sicher, dass Sie dieses Projekt löschen möchten?</h2>
            <div class="flex justify-end gap-2">
              <button class="px-4 py-2 bg-blue-100 text-blue-900 hover:bg-blue-200 rounded-md" onclick="this.closest('.fixed').remove(); window.tempResolve(false)">
                Abbrechen
              </button>
              <button class="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-md" onclick="this.closest('.fixed').remove(); window.tempResolve(true)">
                Löschen
              </button>
            </div>
          </div>
        </div>
      `
      document.body.appendChild(dialog)
      // @ts-expect-error Temporäre Lösung für den Dialog - wird in Zukunft durch eine React-Komponente ersetzt
      window.tempResolve = resolve
    })

    if (confirmed) {
      try {
        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id)
        
        if (error) throw error
        
        setProjects(projects.filter(project => project.id !== id))
        console.log('Projekt erfolgreich gelöscht.')
      } catch (error) {
        console.error('Fehler beim Löschen des Projekts:', error)
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
      <Card className="bg-white border-blue-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
          <CardTitle className="text-2xl font-bold text-blue-900">
            {editMode ? 'Projekt bearbeiten' : 'Projekt einrichten'}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div>
              <Label htmlFor="internalName" className="text-blue-900">Interner Projektname</Label>
              <Input
                id="internalName"
                value={newProject.internal_name}
                onChange={(e) => setNewProject({ ...newProject, internal_name: e.target.value })}
                placeholder="Internen Projektnamen eingeben (z.B. VGN)"
                className="bg-blue-50 border-blue-200 text-blue-900 placeholder-blue-400"
              />
              <InfoText>
                Geben Sie hier den internen Namen des Projekts ein. Dieser wird für die Zuordnung und Berechnung verwendet.
              </InfoText>
            </div>
            <div>
              <Label htmlFor="displayName" className="text-blue-900">Anzeigename des Projekts</Label>
              <Input
                id="displayName"
                value={newProject.display_name}
                onChange={(e) => setNewProject({ ...newProject, display_name: e.target.value })}
                placeholder="Anzeigenamen eingeben (z.B. VGN Media Holding)"
                className="bg-blue-50 border-blue-200 text-blue-900 placeholder-blue-400"
              />
              <InfoText>
                Geben Sie hier den Anzeigenamen des Projekts ein. Dieser wird in Anruflisten und Statistiken angezeigt.
              </InfoText>
            </div>
            <div>
              <Label className="text-blue-900">Vergütungsmodell</Label>
              <Select
                value={newProject.payment_model}
                onValueChange={(value) => setNewProject({ ...newProject, payment_model: value as 'custom' | 'perMinute' | 'perCall' })}
              >
                <SelectTrigger className="w-full mb-2 bg-blue-50 text-blue-900 border-blue-200">
                  <SelectValue placeholder="Wählen Sie ein Vergütungsmodell" />
                </SelectTrigger>
                <SelectContent className="bg-white text-blue-900 border-blue-200">
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
                  className="bg-blue-50 border-blue-200"
                />
                <Label htmlFor="roundUpMinutes" className="text-blue-900">Minuten aufrunden</Label>
              </div>
              <InfoText>
                Wenn aktiviert, werden angebrochene Minuten auf volle Minuten aufgerundet.
              </InfoText>
            </div>
            {newProject.payment_model === 'custom' && (
              <div>
                <Label className="text-blue-900">Benutzerdefiniertes Vergütungsmodell</Label>
                <div className="space-y-2">
                  {newProject.custom_rates.map((rate, index) => (
                    <div key={index} className="flex space-x-2 items-end">
                      <div className="flex-1">
                        <Input
                          type="number"
                          value={rate.minDuration}
                          onChange={(e) => updateCustomRate(index, 'minDuration', Number(e.target.value))}
                          placeholder="Min. Dauer (Sek.)"
                          className="bg-blue-50 border-blue-200 text-blue-900 placeholder-blue-400"
                        />
                        <InfoText>Mindestdauer in Sekunden</InfoText>
                      </div>
                      <div className="flex-1">
                        <Input
                          type="number"
                          value={rate.maxDuration}
                          onChange={(e) => updateCustomRate(index, 'maxDuration', Number(e.target.value))}
                          placeholder="Max. Dauer (Sek.)"
                          className="bg-blue-50 border-blue-200 text-blue-900 placeholder-blue-400"
                        />
                        <InfoText>Maximaldauer in Sekunden</InfoText>
                      </div>
                      <div className="flex-1">
                        <Input
                          type="number"
                          value={rate.rate}
                          onChange={(e) => updateCustomRate(index, 'rate', Number(e.target.value))}
                          placeholder="Vergütung (Cent)"
                          className="bg-blue-50 border-blue-200 text-blue-900 placeholder-blue-400"
                        />
                        <InfoText>Vergütung in Cent (z.B. 40,50 für 40,50 Cent)</InfoText>
                      </div>
                      <Button onClick={() => removeCustomRate(index)} variant="outline" size="icon" className="bg-blue-100 text-blue-900 hover:bg-blue-200 border-blue-300">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button onClick={addCustomRate} variant="outline" className="w-full bg-blue-100 text-blue-900 hover:bg-blue-200 border-blue-300">
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
                <Label htmlFor="perMinuteRate" className="text-blue-900">Vergütung pro Minute (in Cent)</Label>
                <Input
                  id="perMinuteRate"
                  type="number"
                  value={newProject.per_minute_rate}
                  onChange={(e) => setNewProject({ ...newProject, per_minute_rate: Number(e.target.value) })}
                  placeholder="Vergütung in Cent (z.B. 40,50 für 40,50 Cent)"
                  className="bg-blue-50 border-blue-200 text-blue-900 placeholder-blue-400"
                />
                <InfoText>
                  Geben Sie hier den Betrag in Cent ein, der pro Minute vergütet wird.
                </InfoText>
              </div>
            )}
            {newProject.payment_model === 'perCall' && (
              <div>
                <Label htmlFor="perCallRate" className="text-blue-900">Vergütung pro Anruf (in Cent)</Label>
                <Input
                  id="perCallRate"
                  type="number"
                  value={newProject.per_call_rate}
                  onChange={(e) => setNewProject({ ...newProject, per_call_rate: Number(e.target.value) })}
                  placeholder="Vergütung in Cent (z.B. 40,50 für 40,50 Cent)"
                  className="bg-blue-50 border-blue-200 text-blue-900 placeholder-blue-400"
                />
                <InfoText>
                  Geben Sie hier den Betrag in Cent ein, der pro Anruf vergütet wird.
                </InfoText>
              </div>
            )}
            <div>
              <Label htmlFor="minDuration" className="text-blue-900">Mindestdauer für Abrechnung (in Sekunden)</Label>
              <Input
                id="minDuration"
                type="number"
                value={newProject.min_duration}
                onChange={(e) => setNewProject({ ...newProject, min_duration: Number(e.target.value) })}
                className="bg-blue-50 border-blue-200 text-blue-900 placeholder-blue-400"
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
              <Button onClick={resetForm} variant="outline" className="ml-2 bg-blue-100 text-blue-900 hover:bg-blue-200 border-blue-300">
                Abbrechen
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-blue-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
          <CardTitle className="text-2xl font-bold text-blue-900">Vorhandene Projekte</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {projects.length === 0 ? (
            <p className="text-center text-blue-600">Keine Projekte vorhanden.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <Card key={project.id} className="bg-blue-50 shadow-md hover:shadow-lg transition-shadow duration-300 border border-blue-200">
                  <CardHeader className="bg-gradient-to-r from-blue-100 to-indigo-100 border-b border-blue-200">
                    <CardTitle className="text-lg font-semibold flex justify-between items-center text-blue-900">
                      <span>{project.display_name}</span>
                      <div className="flex space-x-2">
                        <Button onClick={() => editProject(project)} variant="ghost" size="sm" className="text-blue-700 hover:text-blue-900 hover:bg-blue-200">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => deleteProject(project.id)} variant="ghost" size="sm" className="text-blue-700 hover:text-blue-900 hover:bg-blue-200">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-3 text-blue-800">
                      <div className="bg-white p-3 rounded-md shadow-sm border border-blue-100">
                        <h4 className="text-sm font-semibold mb-2 flex items-center text-blue-900">
                          <BarChart className="h-4 w-4 mr-2 text-blue-600" />
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
                      <div className="bg-white p-3 rounded-md shadow-sm border border-blue-100">
                        <p className="text-sm">
                          <span className="font-medium">Mindestdauer:</span> {project.min_duration} Sek.
                        </p>
                      </div>
                      {project.payment_model === 'custom' && (
                        <div className="bg-white p-3 rounded-md shadow-sm border border-blue-100">
                          <h4 className="text-sm font-semibold mb-2 flex items-center text-blue-900">
                            <BarChart className="h-4 w-4 mr-2 text-blue-600" />
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
    <div className="flex items-start mt-2 mb-4 text-sm text-blue-600">
      <Info className="mr-1 h-4 w-4 text-blue-500 flex-shrink-0" />
      <p className="flex-1">{children}</p>
    </div>
  )
}

