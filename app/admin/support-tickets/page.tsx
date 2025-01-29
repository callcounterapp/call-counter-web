"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { MessageCircle, Loader2, AlertCircle, CheckCircle2, LayoutDashboard, AlertTriangle, Trash2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { createClient } from "@supabase/supabase-js"
import Link from "next/link"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
)

interface Ticket {
  id: string
  subject: string
  description: string
  status: "offen" | "in_bearbeitung" | "geschlossen"
  priority: "niedrig" | "mittel" | "hoch"
  created_at: string
  user_id: string
  admin_response?: string
  user_email?: string
  user_full_name?: string
}

interface Notification {
  type: "success" | "error" | "warning"
  message: string
}

export default function AdminSupportTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [adminResponse, setAdminResponse] = useState("")
  const [notification, setNotification] = useState<Notification | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("alle")
  const [editedTicket, setEditedTicket] = useState<Ticket | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [ticketToDelete, setTicketToDelete] = useState<Ticket | null>(null)
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const checkAdminAndFetchData = async () => {
      try {
        if (!user) {
          router.push("/auth/login")
          return
        }

        if (user.role !== "admin") {
          router.push("/dashboard")
          return
        }

        await fetchTickets()
      } catch (error) {
        console.error("Fehler:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAdminAndFetchData()
  }, [user, router])

  const fetchTickets = async () => {
    try {
      console.log("Starte Ticket-Abruf...")

      const { data, error } = await supabase
        .from("support_tickets")
        .select(`
          *,
          profiles:user_id (
            email,
            full_name
          )
        `)
        .order("created_at", { ascending: false })

      console.log("Supabase Antwort erhalten:", { data, error })

      if (error) {
        console.error("Supabase Fehler:", JSON.stringify(error, null, 2))
        throw new Error(`Supabase Fehler: ${error.message || "Unbekannter Fehler"}`)
      }

      if (!data) {
        console.error("Keine Daten von Supabase erhalten")
        throw new Error("Keine Daten erhalten")
      }

      console.log("Rohdaten von Supabase:", JSON.stringify(data, null, 2))

      const formattedTickets = data.map((ticket) => ({
        ...ticket,
        user_email: ticket.profiles?.email || "Nicht verfügbar",
        user_full_name: ticket.profiles?.full_name || "Unbekannter Benutzer",
      }))

      console.log("Formatierte Tickets:", JSON.stringify(formattedTickets, null, 2))

      setTickets(formattedTickets)
    } catch (error) {
      console.error("Detaillierter Fehler beim Laden der Tickets:", error)
      if (error instanceof Error) {
        console.error("Fehlermeldung:", error.message)
        console.error("Fehler Stack:", error.stack)
      } else {
        console.error("Unerwarteter Fehlertyp:", typeof error)
      }
      setNotification({
        type: "error",
        message: error instanceof Error ? error.message : "Unbekannter Fehler beim Laden der Tickets.",
      })
    }
  }

  const updateTicketStatus = async (ticketId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("support_tickets")
        .update({
          status: newStatus,
          admin_response: adminResponse || undefined,
        })
        .eq("id", ticketId)

      if (error) throw error

      if (newStatus === "geschlossen") {
        // Email notification removed
      }

      setNotification({
        type: "success",
        message: "Ticket erfolgreich aktualisiert. (E-Mail-Benachrichtigung deaktiviert)",
      })

      await fetchTickets()
      setSelectedTicket(null)
      setEditedTicket(null)
      setAdminResponse("")
      setIsDialogOpen(false)
    } catch (error) {
      console.error("Fehler beim Aktualisieren des Tickets:", error)
      setNotification({
        type: "error",
        message: "Fehler beim Aktualisieren des Tickets.",
      })
    }
  }

  const deleteTicket = async (ticketId: string) => {
    try {
      const { error } = await supabase.from("support_tickets").delete().eq("id", ticketId)

      if (error) throw error

      setNotification({
        type: "success",
        message: "Ticket erfolgreich gelöscht.",
      })

      await fetchTickets()
      setIsDeleteDialogOpen(false)
      setTicketToDelete(null)
    } catch (error) {
      console.error("Fehler beim Löschen des Tickets:", error)
      setNotification({
        type: "error",
        message: "Fehler beim Löschen des Tickets.",
      })
    }
  }

  const filteredTickets = tickets.filter((ticket) => (statusFilter === "alle" ? true : ticket.status === statusFilter))

  if (!user || user.role !== "admin") {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 to-indigo-900">
      <header className="bg-blue-900/30 backdrop-blur-md shadow-lg border-b border-blue-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white tracking-tight">Support-Ticket Verwaltung</h1>
          <Link href="/dashboard">
            <Button
              variant="outline"
              className="bg-blue-100/10 text-blue-100 hover:bg-blue-100/20 border-blue-300/30 backdrop-blur-sm transition-all duration-300"
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="bg-white/95 shadow-2xl border-blue-200/50 backdrop-blur-sm">
          <CardHeader className="border-b border-blue-100/50 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-bold text-blue-900 flex items-center">
                <MessageCircle className="mr-2 h-6 w-6 text-blue-600" />
                Support-Tickets
              </CardTitle>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alle">Alle Tickets</SelectItem>
                  <SelectItem value="offen">Offene Tickets</SelectItem>
                  <SelectItem value="in_bearbeitung">In Bearbeitung</SelectItem>
                  <SelectItem value="geschlossen">Geschlossene Tickets</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {notification && (
              <Alert
                variant={
                  notification.type === "error"
                    ? "destructive"
                    : notification.type === "warning"
                      ? "default"
                      : "default"
                }
                className="mb-4"
              >
                {notification.type === "error" ? (
                  <AlertCircle className="h-4 w-4" />
                ) : notification.type === "warning" ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                <AlertTitle>
                  {notification.type === "error" ? "Fehler" : notification.type === "warning" ? "Warnung" : "Erfolg"}
                </AlertTitle>
                <AlertDescription>{notification.message}</AlertDescription>
              </Alert>
            )}

            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-blue-50 border-b border-blue-200">
                      <TableHead className="text-blue-900 font-semibold">Benutzer</TableHead>
                      <TableHead className="text-blue-900 font-semibold">Betreff</TableHead>
                      <TableHead className="text-blue-900 font-semibold">Status</TableHead>
                      <TableHead className="text-blue-900 font-semibold">Priorität</TableHead>
                      <TableHead className="text-blue-900 font-semibold">Erstellt am</TableHead>
                      <TableHead className="text-blue-900 font-semibold">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          Keine Tickets gefunden
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTickets.map((ticket) => (
                        <TableRow
                          key={ticket.id}
                          className="border-b border-blue-100 hover:bg-blue-50/50 transition-colors"
                        >
                          <TableCell className="font-medium">
                            <div className="text-sm">
                              <p className="font-semibold text-blue-900">{ticket.user_full_name}</p>
                              <p className="text-blue-600">{ticket.user_email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-blue-800">{ticket.subject}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                ticket.status === "offen"
                                  ? "default"
                                  : ticket.status === "in_bearbeitung"
                                    ? "secondary"
                                    : "outline"
                              }
                              className={`${
                                ticket.status === "offen"
                                  ? "bg-green-100 text-green-800"
                                  : ticket.status === "in_bearbeitung"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {ticket.status === "offen"
                                ? "Offen"
                                : ticket.status === "in_bearbeitung"
                                  ? "In Bearbeitung"
                                  : "Geschlossen"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                ticket.priority === "hoch"
                                  ? "destructive"
                                  : ticket.priority === "mittel"
                                    ? "default"
                                    : "secondary"
                              }
                              className={`${
                                ticket.priority === "hoch"
                                  ? "bg-red-100 text-red-800"
                                  : ticket.priority === "mittel"
                                    ? "bg-orange-100 text-orange-800"
                                    : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {ticket.priority === "hoch"
                                ? "Hoch"
                                : ticket.priority === "mittel"
                                  ? "Mittel"
                                  : "Niedrig"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-blue-800">
                            {new Date(ticket.created_at).toLocaleString("de-DE")}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedTicket(ticket)
                                      setEditedTicket({ ...ticket })
                                      setAdminResponse(ticket.admin_response || "")
                                      setIsDialogOpen(true)
                                    }}
                                  >
                                    Details
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[500px]">
                                  <DialogHeader>
                                    <DialogTitle>Ticket Details</DialogTitle>
                                    <DialogDescription>Ticket von {selectedTicket?.user_full_name}</DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                      <h4 className="font-medium">Beschreibung</h4>
                                      <p className="text-sm text-gray-600">{selectedTicket?.description}</p>
                                    </div>
                                    {selectedTicket?.admin_response && (
                                      <div className="space-y-2">
                                        <h4 className="font-medium">Admin Antwort</h4>
                                        <p className="text-sm text-gray-600">{selectedTicket.admin_response}</p>
                                      </div>
                                    )}
                                    <div className="space-y-2">
                                      <h4 className="font-medium">Status ändern</h4>
                                      <Select
                                        value={editedTicket?.status || selectedTicket?.status}
                                        onValueChange={(value) =>
                                          setEditedTicket({ ...editedTicket!, status: value as Ticket["status"] })
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue placeholder="Status auswählen" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="offen">Offen</SelectItem>
                                          <SelectItem value="in_bearbeitung">In Bearbeitung</SelectItem>
                                          <SelectItem value="geschlossen">Geschlossen</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="space-y-2">
                                      <h4 className="font-medium">Admin Antwort</h4>
                                      <Textarea
                                        value={adminResponse}
                                        onChange={(e) => setAdminResponse(e.target.value)}
                                        placeholder="Geben Sie hier Ihre Antwort ein..."
                                        rows={4}
                                      />
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setSelectedTicket(null)
                                        setEditedTicket(null)
                                        setAdminResponse("")
                                        setIsDialogOpen(false)
                                      }}
                                    >
                                      Abbrechen
                                    </Button>
                                    <Button
                                      onClick={() => updateTicketStatus(selectedTicket!.id, editedTicket!.status)}
                                    >
                                      Speichern
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  setTicketToDelete(ticket)
                                  setIsDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ticket löschen</DialogTitle>
            <DialogDescription>
              Sind Sie sicher, dass Sie dieses Ticket löschen möchten? Diese Aktion kann nicht rückgängig gemacht
              werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button variant="destructive" onClick={() => ticketToDelete && deleteTicket(ticketToDelete.id)}>
              Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

