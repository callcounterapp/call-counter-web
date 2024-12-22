'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./ui/select"
import { Info, Edit, Trash2, Plus, BarChart } from 'lucide-react'
import { Checkbox } from "./ui/checkbox"
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'

interface Project {
  id: string;
  internal_name: string;
  display_name: string;
  payment_model: 'perMinute' | 'perCall' | 'custom';
  min_duration: number;
  round_up_minutes: boolean;
  per_minute_rate?: number;
  per_call_rate?: number;
  custom_rates?: { minDuration: number; maxDuration: number; rate: number }[];
  user_id: string;
}

interface ProjectSetupProps {
  projects?: Project[];
}

interface InfoTextProps {
  children: React.ReactNode;
}

export default function ProjectSetup({ projects = [] }: ProjectSetupProps) {
  const { user } = useAuth()
  
  const [localProjects, setLocalProjects] = useState<Project[]>([])

  const fetchProjects = useCallback(async () => {
    if (!user?.id) return;
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)

      if (error) throw error
      
      const typedData = (data || []) as unknown as Project[];
      setLocalProjects(typedData);
    } catch (error) {
      console.error('Error fetching projects:', error)
      alert('Fehler beim Laden der Projekte. Bitte versuchen Sie es erneut.')
    }
  }, [user?.id])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  useEffect(() => {
    if (projects.length > 0) {
      setLocalProjects(projects);
    }
  }, [projects]);

  const resetForm = () => {
    setNewProject({
      id: null,
      internalName: '',
      displayName: '',
      paymentModel: 'custom',
      customRates: [{ minDuration: '', maxDuration: '', rate: '' }],
      minDuration: '',
      perMinuteRate: '',
      perCallRate: '',
      roundUpMinutes: true,
    })
    setEditMode(false)
  }

  const [newProject, setNewProject] = useState({
    id: null as string | null,
    internalName: '',
    displayName: '',
    paymentModel: 'custom' as 'custom' | 'perMinute' | 'perCall',
    customRates: [{ minDuration: '', maxDuration: '', rate: '' }],
    minDuration: '',
    perMinuteRate: '',
    perCallRate: '',
    roundUpMinutes: true,
  })
  const [editMode, setEditMode] = useState(false)

  const addOrUpdateProject = async () => {
    if (!newProject.internalName.trim() || !newProject.displayName.trim()) {
      alert("Bitte geben Sie sowohl einen internen Namen als auch einen Anzeigenamen ein.");
      return;
    }

    const projectToSave = {
      internal_name: newProject.internalName.trim(),
      display_name: newProject.displayName.trim(),
      payment_model: newProject.paymentModel,
      custom_rates: newProject.customRates.map(rate => ({
        minDuration: parseInt(rate.minDuration) || 0,
        maxDuration: parseInt(rate.maxDuration) || 0,
        rate: Math.round(parseFloat(rate.rate.replace(',', '.')) * 100) || 0
      })),
      min_duration: parseInt(newProject.minDuration) || 0,
      per_minute_rate: Math.round(parseFloat(newProject.perMinuteRate.replace(',', '.')) * 100) || 0,
      per_call_rate: Math.round(parseFloat(newProject.perCallRate.replace(',', '.')) * 100) || 0,
      round_up_minutes: newProject.roundUpMinutes,
      user_id: user?.id
    }

    try {
      let result;
      if (editMode) {
        const { data, error } = await supabase
          .from('projects')
          .update(projectToSave)
          .eq('id', newProject.id)
          .eq('user_id', user?.id)
          .select()
        
        if (error) throw error
        result = data[0]
      } else {
        const { data, error } = await supabase
          .from('projects')
          .insert([projectToSave])
          .select()
        
        if (error) throw error
        result = data[0]
      }

      if (result) {
        setLocalProjects(prevProjects => {
          const updatedProjects = editMode
            ? prevProjects.map(p => p.id === result.id ? result : p)
            : [...prevProjects, result];
          return updatedProjects;
        });
        resetForm();
        alert(editMode ? 'Projekt erfolgreich aktualisiert.' : 'Projekt erfolgreich erstellt.');
      } else {
        throw new Error('Keine Daten von der Datenbank zurückgegeben.');
      }
    } catch (error) {
      console.error('Error saving project:', error);
      alert(`Fehler beim ${editMode ? 'Aktualisieren' : 'Erstellen'} des Projekts: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
    }
  }

  const editProject = (project: Project) => {
    setNewProject({
      id: project.id,
      internalName: project.internal_name,
      displayName: project.display_name,
      paymentModel: project.payment_model,
      customRates: project.custom_rates ? project.custom_rates.map(rate => ({
        minDuration: rate.minDuration?.toString() || '',
        maxDuration: rate.maxDuration?.toString() || '',
        rate: (rate.rate / 100).toFixed(2).replace('.', ',') || ''
      })) : [],
      minDuration: project.min_duration?.toString() || '',
      perMinuteRate: (project.per_minute_rate ? project.per_minute_rate / 100 : 0).toFixed(2).replace('.', ',') || '',
      perCallRate: (project.per_call_rate ? project.per_call_rate / 100 : 0).toFixed(2).replace('.', ',') || '',
      roundUpMinutes: project.round_up_minutes,
    })
    setEditMode(true)
  }

  const deleteProject = async (id: string) => {
    if (window.confirm('Sind Sie sicher, dass Sie dieses Projekt löschen möchten?')) {
      try {
        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('id', id)
          .eq('user_id', user?.id)
        
        if (error) throw error
        
        const updatedProjects = localProjects.filter(project => project.id !== id)
        setLocalProjects(updatedProjects)
      } catch (error) {
        console.error('Error deleting project:', error)
        alert('Fehler beim Löschen des Projekts. Bitte versuchen Sie es erneut.')
      }
    }
  }

  const addCustomRate = () => {
    setNewProject({
      ...newProject,
      customRates: [...newProject.customRates, { minDuration: '', maxDuration: '', rate: '' }]
    })
  }

  const updateCustomRate = (index: number, field: string, value: string) => {
    const updatedRates = [...newProject.customRates]
    updatedRates[index] = { ...updatedRates[index], [field]: value }
    setNewProject({ ...newProject, customRates: updatedRates })
  }

  const removeCustomRate = (index: number) => {
    const updatedRates = newProject.customRates.filter((_, i) => i !== index)
    setNewProject({ ...newProject, customRates: updatedRates })
  }

  const InfoText = ({ children }: InfoTextProps) => (
    <div className="flex items-start mt-2 mb-4 text-sm text-gray-500">
      <Info className="mr-1 h-4 w-4 text-blue-500 flex-shrink-0" />
      <p className="flex-1">{children}</p>
    </div>
  )

  const formatCurrency = (amount: number) => {
    const euros = Math.floor(amount / 100);
    const cents = amount % 100;
    return `${euros},${cents.toString().padStart(2, '0')} €`;
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="bg-gray-100 border-b border-gray-200">
          <CardTitle className="text-2xl font-bold flex items-center text-gray-800">
            {editMode ? 'Projekt bearbeiten' : 'Projekt einrichten'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <Label htmlFor="internalName">Interner Projektname</Label>
              <Input
                id="internalName"
                value={newProject.internalName}
                onChange={(e) => setNewProject({ ...newProject, internalName: e.target.value })}
                placeholder="Internen Projektnamen eingeben (z.B. *50)"
              />
              <InfoText>
                Geben Sie hier den internen Namen des Projekts ein. Dieser wird für die Zuordnung und Berechnung verwendet.
              </InfoText>
            </div>
            <div>
              <Label htmlFor="displayName">Anzeigename des Projekts</Label>
              <Input
                id="displayName"
                value={newProject.displayName}
                onChange={(e) => setNewProject({ ...newProject, displayName: e.target.value })}
                placeholder="Anzeigenamen eingeben (z.B. ABCOutcall)"
              />
              <InfoText>
                Geben Sie hier den Anzeigenamen des Projekts ein. Dieser wird in Anruflisten und Statistiken angezeigt.
              </InfoText>
            </div>
            <div>
              <Label>Vergütungsmodell</Label>
              <Select
                value={newProject.paymentModel}
                onValueChange={(value) => setNewProject({ ...newProject, paymentModel: value as 'custom' | 'perMinute' | 'perCall' })}
              >
                <SelectTrigger className="w-full mb-2">
                  <SelectValue placeholder="Wählen Sie ein Vergütungsmodell" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="custom">Benutzerdefiniert</SelectItem>
                  <SelectItem value="perMinute">Pro Minute</SelectItem>
                  <SelectItem value="perCall">Pro Anruf</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center space-x-2 mt-4">
                <Checkbox
                  id="roundUpMinutes"
                  checked={newProject.roundUpMinutes}
                  onCheckedChange={(checked) => setNewProject({ ...newProject, roundUpMinutes: checked as boolean })}
                />
                <Label htmlFor="roundUpMinutes">Minuten aufrunden</Label>
              </div>
              <InfoText>
                Wenn aktiviert, werden angebrochene Minuten auf volle Minuten aufgerundet.
              </InfoText>
            </div>
            {newProject.paymentModel === 'custom' && (
              <div>
                <Label>Benutzerdefiniertes Vergütungsmodell</Label>
                <div className="space-y-2">
                  {newProject.customRates.map((rate, index) => (
                    <div key={index} className="flex space-x-2 items-end">
                      <div className="flex-1">
                        <Input
                          type="number"
                          value={rate.minDuration}
                          onChange={(e) => updateCustomRate(index, 'minDuration', e.target.value)}
                          placeholder="Min. Dauer (Sek.)"
                        />
                        <InfoText>Mindestdauer in Sekunden</InfoText>
                      </div>
                      <div className="flex-1">
                        <Input
                          type="number"
                          value={rate.maxDuration}
                          onChange={(e) => updateCustomRate(index, 'maxDuration', e.target.value)}
                          placeholder="Max. Dauer (Sek.)"
                        />
                        <InfoText>Maximaldauer in Sekunden</InfoText>
                      </div>
                      <div className="flex-1">
                        <Input
                          type="text"
                          value={rate.rate}
                          onChange={(e) => updateCustomRate(index, 'rate', e.target.value)}
                          placeholder="Vergütung (Cent)"
                        />
                        <InfoText>Vergütung in Cent (z.B. 40,50 für 40,50 Cent)</InfoText>
                      </div>
                      <Button onClick={() => removeCustomRate(index)} variant="outline" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button onClick={addCustomRate} variant="outline" className="w-full">
                    <Plus className="h-4 w-4 mr-2" /> Weitere Vergütungsstufe hinzufügen
                  </Button>
                </div>
                <InfoText>
                  Definieren Sie hier die Vergütungsstufen. Geben Sie die minimale und maximale
                  Anrufdauer in Sekunden und den entsprechenden Vergütungsbetrag in Cent ein.
                </InfoText>
              </div>
            )}
            {newProject.paymentModel === 'perMinute' && (
              <div>
                <Label htmlFor="perMinuteRate">Vergütung pro Minute (in Cent)</Label>
                <Input
                  id="perMinuteRate"
                  type="text"value={newProject.perMinuteRate}
                  onChange={(e) => setNewProject({ ...newProject, perMinuteRate: e.target.value })}
                  placeholder="Vergütung in Cent (z.B. 40,50 für 40,50 Cent)"
                />
                <InfoText>
                  Geben Sie hier den Betrag in Cent ein, der pro Minute vergütet wird.
                </InfoText>
              </div>
            )}
            {newProject.paymentModel === 'perCall' && (
              <div>
                <Label htmlFor="perCallRate">Vergütung pro Anruf (in Cent)</Label>
                <Input
                  id="perCallRate"
                  type="text"
                  value={newProject.perCallRate}
                  onChange={(e) => setNewProject({ ...newProject, perCallRate: e.target.value })}
                  placeholder="Vergütung in Cent (z.B. 40,50 für 40,50 Cent)"
                />
                <InfoText>
                  Geben Sie hier den Betrag in Cent ein, der pro Anruf vergütet wird.
                </InfoText>
              </div>
            )}
            <div>
              <Label htmlFor="minDuration">Mindestdauer für Abrechnung (in Sekunden)</Label>
              <Input
                id="minDuration"
                type="number"
                value={newProject.minDuration}
                onChange={(e) => setNewProject({ ...newProject, minDuration: e.target.value })}
              />
              <InfoText>
                Geben Sie hier die Mindestdauer in Sekunden ein, ab der ein Anruf vergütet wird.
                Anrufe unter dieser Dauer werden nicht berechnet.
              </InfoText>
            </div>
            <Button onClick={addOrUpdateProject}>
              {editMode ? 'Projekt aktualisieren' : 'Projekt hinzufügen'}
            </Button>
            {editMode && (
              <Button onClick={resetForm} variant="outline">Abbrechen</Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vorhandene Projekte</CardTitle>
        </CardHeader>
        <CardContent>
          {Array.isArray(localProjects) && localProjects.length === 0 ? (
            <p className="text-center text-gray-500">Keine Projekte vorhanden.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.isArray(localProjects) && localProjects.map((project) => (
                <Card key={project.id} className="bg-gray-50 shadow-md hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="bg-gray-50 border-b">
                    <CardTitle className="text-lg font-semibold flex justify-between items-center">
                      <span>{project.display_name}</span>
                      <div className="flex space-x-2">
                        <Button onClick={() => editProject(project)} variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => deleteProject(project.id)} variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="bg-white p-3 rounded-md shadow-sm">
                        <h4 className="text-sm font-semibold mb-2 flex items-center">
                          <BarChart className="h-4 w-4 mr-2 text-blue-500" />
                          Projektdetails
                        </h4>
                        <p className="text-sm text-gray-800">
                          <span className="font-medium">Interner Name:</span> {project.internal_name}
                        </p>
                        <p className="text-sm text-gray-800">
                          <span className="font-medium">Anzeigename:</span> {project.display_name}
                        </p>
                        <p className="text-sm text-gray-800 mt-2">
                          <span className="font-medium">Vergütungsmodell:</span> {' '}
                          {project.payment_model === 'custom' && 'Benutzerdefiniert'}
                          {project.payment_model === 'perMinute' && 'Pro Minute'}
                          {project.payment_model === 'perCall' && 'Pro Anruf'}
                        </p>
                        <p className="text-sm text-gray-800 mt-2">
                          <span className="font-medium">Minuten aufrunden:</span> {project.round_up_minutes ? 'Ja' : 'Nein'}
                        </p>
                        {project.payment_model === 'custom' && project.custom_rates && (
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Vergütungsstufen:</span> {project.custom_rates.length}
                          </p>
                        )}
                        {project.payment_model === 'perMinute' && project.per_minute_rate && (
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Vergütung pro Minute:</span> {formatCurrency(project.per_minute_rate)}
                          </p>
                        )}
                        {project.payment_model === 'perCall' && project.per_call_rate && (
                          <p className="text-sm text-gray-600 mt-1">
                            <span className="font-medium">Vergütung pro Anruf:</span> {formatCurrency(project.per_call_rate)}
                          </p>
                        )}
                      </div>
                      <div className="bg-white p-3 rounded-md shadow-sm">
                        <p className="text-sm text-gray-800">
                          <span className="font-medium">Mindestdauer:</span> {project.min_duration} Sek.
                        </p>
                      </div>
                      {project.payment_model === 'custom' && project.custom_rates && (
                        <div className="bg-white p-3 rounded-md shadow-sm">
                          <h4 className="text-sm font-semibold mb-2 flex items-center">
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

