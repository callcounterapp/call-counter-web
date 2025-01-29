"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, MessageCircle, Loader2, LayoutDashboard } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { useTicketNotification } from "@/contexts/TicketNotificationContext"
import { supabase } from "@/lib/supabaseClient"
import Link from "next/link"

interface Ticket {
  id: string
  subject: string
  description: string
  status: "offen" | "in_bearbeitung" | "geschlossen"
  priority: "niedrig" | "mittel" | "hoch"
  created_at: string
  user_id: string
  admin_response?: string
}

export default function SupportTicketPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<"niedrig" | "mittel" | "hoch">("mittel")
  const { user } = useAuth()
  const { resetNotification } = useTicketNotification()
  const router = useRouter()

  useEffect(() => {
    const checkAndFetchData = async () => {
      try {
        if (!user) {
          router.push("/auth/login")
          return
        }

        const { data, error } = await supabase
          .from("support_tickets")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Fehler beim Laden der Tickets:", error)
          return
        }

        setTickets(data || [])
      } catch (error) {
        console.error("Fehler:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAndFetchData()
    resetNotification() // Reset the notification when the page is loaded
  }, [user, router, resetNotification])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      setIsLoading(true)
      const { error } = await supabase.from("support_tickets").insert([
        {
          subject,
          description,
          priority,
          status: "offen",
          user_id: user.id,
        },
      ])

      if (error) throw error

      const { data: newTickets } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      setTickets(newTickets || [])
      setSubject("")
      setDescription("")
      setPriority("mittel")
    } catch (error) {
      console.error("Fehler beim Erstellen des Tickets:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 to-indigo-900">
      <header className="bg-blue-900/30 backdrop-blur-md shadow-lg border-b border-blue-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white tracking-tight">Support-Tickets</h1>
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
            <CardTitle className="text-2xl font-bold text-blue-900 flex items-center">
              <MessageCircle className="mr-2 h-6 w-6 text-blue-600" />
              Ticket erstellen
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  placeholder="Betreff"
                  className="bg-white border-gray-300"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
                <Select value={priority} onValueChange={(value: "niedrig" | "mittel" | "hoch") => setPriority(value)}>
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue placeholder="Priorität" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="niedrig">Niedrig</SelectItem>
                    <SelectItem value="mittel">Mittel</SelectItem>
                    <SelectItem value="hoch">Hoch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                placeholder="Beschreiben Sie Ihr Anliegen..."
                className="bg-white border-gray-300"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Wird gespeichert...
                  </>
                ) : (
                  <>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Ticket erstellen
                  </>
                )}
              </Button>
            </form>

            {isLoading && tickets.length === 0 ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-blue-50 border-b border-blue-200">
                      <TableHead className="text-blue-900 font-semibold">Betreff</TableHead>
                      <TableHead className="text-blue-900 font-semibold">Status</TableHead>
                      <TableHead className="text-blue-900 font-semibold">Priorität</TableHead>
                      <TableHead className="text-blue-900 font-semibold">Erstellt am</TableHead>
                      <TableHead className="text-blue-900 font-semibold">Admin-Antwort</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          Keine Tickets vorhanden
                        </TableCell>
                      </TableRow>
                    ) : (
                      tickets.map((ticket) => (
                        <TableRow
                          key={ticket.id}
                          className="border-b border-blue-100 hover:bg-blue-50/50 transition-colors"
                        >
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
                          <TableCell className="text-blue-800">
                            {ticket.admin_response ? (
                              <div className="max-w-md">
                                <p className="text-sm bg-blue-50 p-3 rounded-lg border border-blue-100">
                                  {ticket.admin_response}
                                </p>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm italic">Noch keine Antwort</span>
                            )}
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
    </div>
  )
}

