'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { createClient } from '@supabase/supabase-js'
import { useDropzone } from 'react-dropzone'
import { Loader2, Upload, AlertCircle, CheckCircle2, ImageIcon, Calendar, Clock, Edit, Trash2 } from 'lucide-react'
import Image from 'next/image'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

type NotificationType = 'success' | 'error' | null;

interface Notification {
  type: NotificationType;
  message: string;
}

interface DashboardInfo {
  id: number;
  title: string;
  content: string;
  image_url: string | null;
  created_at: string;
}

function DashboardInfoList({ data, onEdit, onDelete }: { 
  data: DashboardInfo[], 
  onEdit: (info: DashboardInfo) => void,
  onDelete: (id: number) => void
}) {
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-6 text-white">Vorhandene Dashboard-Informationen</h2>
      {data.length === 0 ? (
        <p className="text-blue-200">Keine Einträge vorhanden.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data.map((info) => (
            <Card key={info.id} className="bg-white/10 backdrop-blur-lg border-blue-300/20 text-white hover:bg-white/20 transition-all duration-300">
              <CardHeader>
                <CardTitle className="text-xl font-semibold">{info.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-100 mb-4 line-clamp-3">{info.content}</p>
                {info.image_url && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <div className="relative h-32 w-full cursor-pointer overflow-hidden rounded-md">
                        <Image 
                          src={info.image_url || "/placeholder.svg"}
                          alt={info.title}
                          layout="fill"
                          objectFit="cover"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                          <ImageIcon className="w-8 h-8 text-white" />
                        </div>
                      </div>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[800px]">
                      <DialogHeader>
                        <DialogTitle>{info.title}</DialogTitle>
                        <DialogDescription>Bild in Vollgröße</DialogDescription>
                      </DialogHeader>
                      <div className="relative w-full h-[60vh]">
                        <Image 
                          src={info.image_url || "/placeholder.svg"}
                          alt={info.title}
                          layout="fill"
                          objectFit="contain"
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </CardContent>
              <CardContent className="text-xs text-blue-200 flex items-center justify-between">
                <span className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {new Date(info.created_at).toLocaleDateString()}
                </span>
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {new Date(info.created_at).toLocaleTimeString()}
                </span>
              </CardContent>
              <CardContent className="pt-2">
                <Button variant="outline" size="sm" className="mr-2" onClick={() => onEdit(info)}>
                  <Edit className="w-4 h-4 mr-1" />
                  Bearbeiten
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="w-4 h-4 mr-1" />
                      Löschen
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Sind Sie sicher?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Diese Aktion kann nicht rückgängig gemacht werden. Dies wird den Eintrag dauerhaft aus der Datenbank entfernen.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(info.id)}>Löschen</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default function DashboardInfo() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [image, setImage] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [notification, setNotification] = useState<Notification | null>(null)
  const [dashboardData, setDashboardData] = useState<DashboardInfo[]>([])
  const [editingInfo, setEditingInfo] = useState<DashboardInfo | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.error("User is not authenticated")
      } else {
        setIsAuthenticated(true)
        fetchDashboardInfo()
      }
    }
    checkAuth()
  }, [])

  const fetchDashboardInfo = async () => {
    const { data, error } = await supabase
      .from('dashboard_info')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching dashboard info:', error)
    } else {
      setDashboardData(data)
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setImage(acceptedFiles[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: {'image/*': []} })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setNotification(null)

    try {
      let imageUrl = editingInfo?.image_url || ''

      if (image) {
        const fileExt = image.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('dashboard-images')
          .upload(fileName, image)

        if (uploadError) {
          console.error('Fehler beim Hochladen des Bildes:', uploadError)
          throw new Error(`Bilduploadfehler: ${uploadError.message}`)
        }

        if (!uploadData) {
          throw new Error('Keine Daten vom Bildupload erhalten')
        }

        const { data } = supabase.storage
          .from('dashboard-images')
          .getPublicUrl(fileName)

        if (!data || !data.publicUrl) {
          console.error('Fehler beim Abrufen der öffentlichen URL')
          throw new Error('URL-Abruffehler: Keine öffentliche URL erhalten')
        }

        imageUrl = data.publicUrl
      }

      if (editingInfo) {
        const { error: updateError } = await supabase
          .from('dashboard_info')
          .update({ title, content, image_url: imageUrl })
          .eq('id', editingInfo.id)

        if (updateError) {
          console.error('Fehler beim Aktualisieren des Eintrags:', updateError)
          throw new Error(`Aktualisierungsfehler: ${updateError.message}`)
        }
      } else {
        const { error: insertError } = await supabase
          .from('dashboard_info')
          .insert([
            { title, content, image_url: imageUrl }
          ])

        if (insertError) {
          console.error('Fehler beim Einfügen in die Datenbank:', insertError)
          throw new Error(`Datenbankfehler: ${insertError.message}`)
        }
      }

      console.log('Dashboard-Informationen erfolgreich in die Datenbank eingefügt/aktualisiert')

      setNotification({
        type: 'success',
        message: editingInfo 
          ? 'Dashboard-Informationen wurden erfolgreich aktualisiert.' 
          : 'Dashboard-Informationen wurden erfolgreich hochgeladen.'
      })

      // Reset form fields
      setTitle('')
      setContent('')
      setImage(null)
      setEditingInfo(null)

      // Fetch updated data
      fetchDashboardInfo()

    } catch (error) {
      console.error('Detaillierter Fehler beim Hochladen/Aktualisieren der Dashboard-Informationen:', error)
      setNotification({
        type: 'error',
        message: error instanceof Error ? error.message : "Ein unbekannter Fehler ist aufgetreten."
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (info: DashboardInfo) => {
    setEditingInfo(info)
    setTitle(info.title)
    setContent(info.content)
    setImage(null) // Reset image state when editing
    window.scrollTo(0, 0) // Scroll to top to show the form
  }

  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase
        .from('dashboard_info')
        .delete()
        .eq('id', id)

      if (error) {
        throw error
      }

      setNotification({
        type: 'success',
        message: 'Eintrag erfolgreich gelöscht.'
      })

      fetchDashboardInfo()
    } catch (error) {
      console.error('Fehler beim Löschen des Eintrags:', error)
      setNotification({
        type: 'error',
        message: 'Fehler beim Löschen des Eintrags.'
      })
    }
  }

  if (!isAuthenticated) {
    return null // or a loading spinner
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 to-indigo-900">
      <main className="container mx-auto p-6">
        <Card className="w-full max-w-2xl mx-auto bg-white/10 backdrop-blur-lg border-blue-300/20 shadow-2xl mb-8">
          <CardHeader className="border-b border-blue-300/20 bg-gradient-to-r from-blue-900/50 to-indigo-900/50">
            <CardTitle className="text-2xl font-bold text-white">
              {editingInfo ? 'Dashboard-Informationen bearbeiten' : 'Dashboard-Informationen hochladen'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {notification && (
              <Alert variant={notification.type === 'error' ? 'destructive' : 'default'} className="mb-4">
                {notification.type === 'error' ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                <AlertTitle>{notification.type === 'error' ? 'Fehler' : 'Erfolg'}</AlertTitle>
                <AlertDescription>{notification.message}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-blue-100">Titel</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="bg-white/10 border-blue-300/20 text-white placeholder-blue-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content" className="text-blue-100">Inhalt</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  className="bg-white/10 border-blue-300/20 text-white placeholder-blue-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-blue-100">Bild</Label>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-md p-4 text-center cursor-pointer ${
                    isDragActive ? 'border-blue-400 bg-blue-900/30' : 'border-blue-300/20 bg-white/10'
                  }`}
                >
                  <input {...getInputProps()} />
                  {image ? (
                    <p className="text-blue-100">{image.name}</p>
                  ) : editingInfo && editingInfo.image_url ? (
                    <p className="text-blue-100">Aktuelles Bild: {editingInfo.image_url.split('/').pop()}</p>
                  ) : isDragActive ? (
                    <p className="text-blue-100">Lassen Sie das Bild hier fallen ...</p>
                  ) : (
                    <div className="text-blue-100">
                      <Upload className="mx-auto h-12 w-12 text-blue-300" />
                      <p>Ziehen Sie ein Bild hierher oder klicken Sie, um ein Bild auszuwählen</p>
                    </div>
                  )}
                </div>
              </div>
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Wird {editingInfo ? 'aktualisiert' : 'hochgeladen'}...
                  </>
                ) : (
                  editingInfo ? 'Aktualisieren' : 'Hochladen'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <DashboardInfoList 
          data={dashboardData} 
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </main>
    </div>
  )
}

