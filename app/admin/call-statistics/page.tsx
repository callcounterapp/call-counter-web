"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import {
  LayoutDashboard,
  MessageCircle,
  Info,
  PhoneCall,
  Search,
  Loader2,
  PhoneOff,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
} from "lucide-react"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface Call {
  id: number
  type: string
  name: string
  number: string
  formattedtime: string
  formattedduration: string
  info: string
  created_at: string
  user_id: string
}

interface Agent {
  id: string
  full_name: string
  email: string
}

const ITEMS_PER_PAGE = 15 // Anzahl der Einträge pro Seite

export default function AdminAgentsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [calls, setCalls] = useState<Call[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedAgentName, setSelectedAgentName] = useState<string>("")

  const fetchAgents = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("profiles").select("id, full_name, email")

      if (error) throw error
      setAgents(data || [])
    } catch (error) {
      console.error("Error fetching agents:", error)
      toast({
        id: "fetch-agents-error",
        title: "Fehler",
        description: "Agenten konnten nicht geladen werden.",
        variant: "destructive",
      })
    }
  }, [toast])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          router.push("/auth/login")
          return
        }

        const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single()

        if (profile?.role !== "admin") {
          router.push("/dashboard")
          return
        }

        setIsAuthorized(true)
        fetchAgents()
      } catch (error) {
        console.error("Auth check error:", error)
        router.push("/dashboard")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router, fetchAgents])

  const fetchAgentCalls = async (agentId: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("calls")
        .select("*")
        .eq("user_id", agentId)
        .order("formattedtime", { ascending: false })

      if (error) throw error

      setCalls(data || [])
    } catch (error) {
      console.error("Error fetching agent calls:", error)
      toast({
        id: "fetch-calls-error",
        title: "Fehler",
        description: "Anrufe konnten nicht geladen werden.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAgentSelect = (agentId: string) => {
    setSelectedAgent(agentId)
    const selectedAgent = agents.find((agent) => agent.id === agentId)
    setSelectedAgentName(selectedAgent ? selectedAgent.full_name || selectedAgent.email : "")
    setCurrentPage(1)
    fetchAgentCalls(agentId)
  }

  const filteredCalls = calls.filter(
    (call) =>
      call.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.number.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalPages = Math.ceil(filteredCalls.length / ITEMS_PER_PAGE)
  const paginatedCalls = filteredCalls.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const formatCallType = (type: string | number): string => {
    const typeLower = typeof type === "string" ? type.toLowerCase() : type.toString()
    if (typeLower === "1" || typeLower === "in") return "in"
    if (typeLower === "0" || typeLower === "out") return "out"
    return typeLower
  }

  const getCallTypeIcon = (type: string | number) => {
    const formattedType = formatCallType(type)
    if (formattedType === "in") return <PhoneIncoming className="mr-2 h-4 w-4" />
    if (formattedType === "out") return <PhoneOutgoing className="mr-2 h-4 w-4" />
    if (formattedType.includes("miss")) return <PhoneMissed className="mr-2 h-4 w-4" />
    return null
  }

  const handlePageChange = (direction: "prev" | "next") => {
    if (direction === "prev" && currentPage > 1) {
      setCurrentPage((curr) => curr - 1)
    } else if (direction === "next" && currentPage < totalPages) {
      setCurrentPage((curr) => curr + 1)
    }
  }

  useEffect(() => {
    setCurrentPage(1)
  }, []) // Removed selectedAgent dependency

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 to-indigo-900 flex justify-center items-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 to-indigo-900">
      <header className="bg-blue-900/30 backdrop-blur-md shadow-lg border-b border-blue-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white tracking-tight">Agentenverwaltung</h1>
          <div className="flex space-x-4">
            <Link href="/admin/dashboard-info">
              <Button
                variant="outline"
                className="bg-blue-100/10 text-blue-100 hover:bg-blue-100/20 border-blue-300/30 backdrop-blur-sm transition-all duration-300"
              >
                <Info className="mr-2 h-4 w-4" />
                Dashboard Info
              </Button>
            </Link>
            <Link href="/admin/call-statistics">
              <Button
                variant="outline"
                className="bg-blue-100/10 text-blue-100 hover:bg-blue-100/20 border-blue-300/30 backdrop-blur-sm transition-all duration-300"
              >
                <PhoneCall className="mr-2 h-4 w-4" />
                Call Statistics
              </Button>
            </Link>
            <Link href="/admin/support-tickets">
              <Button
                variant="outline"
                className="bg-blue-100/10 text-blue-100 hover:bg-blue-100/20 border-blue-300/30 backdrop-blur-sm transition-all duration-300"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Support Tickets
              </Button>
            </Link>
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
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="bg-white/95 shadow-2xl border-blue-200/50 backdrop-blur-sm">
          <CardHeader className="border-b border-blue-100/50 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="text-2xl font-bold text-blue-900 flex items-center">
              Agenten und Anrufe verwalten
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6 mt-6">
              <Select onValueChange={handleAgentSelect} value={selectedAgent || undefined}>
                <SelectTrigger className="w-[300px] bg-blue-50 border-blue-200 text-blue-900">
                  <SelectValue placeholder="Agent auswählen">{selectedAgentName || "Agent auswählen"}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.full_name || agent.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedAgent && (
                <div className="relative flex-grow">
                  <Input
                    placeholder="Anrufe suchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-blue-50 border-blue-200 text-blue-900 placeholder-blue-400"
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-400" />
                </div>
              )}
            </div>
            {selectedAgent && (
              <div className="overflow-x-auto rounded-lg border border-blue-200">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-blue-200 bg-blue-50">
                      <TableHead className="text-blue-900 font-semibold">Name</TableHead>
                      <TableHead className="text-blue-900 font-semibold">Nummer</TableHead>
                      <TableHead className="text-blue-900 font-semibold">Status</TableHead>
                      <TableHead className="text-blue-900 font-semibold">Datum & Zeit</TableHead>
                      <TableHead className="text-blue-900 font-semibold">Dauer</TableHead>
                      <TableHead className="text-blue-900 font-semibold">Info</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2 text-blue-600">
                            <Loader2 className="h-8 w-8 animate-spin" />
                            <p>Anrufe werden geladen...</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : paginatedCalls.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2 text-blue-600">
                            <PhoneOff className="h-8 w-8 opacity-50" />
                            <p>Keine Anrufe gefunden</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedCalls.map((call) => (
                        <TableRow key={call.id} className="border-b border-blue-100">
                          <TableCell className="text-blue-900">{call.name || "N/A"}</TableCell>
                          <TableCell className="text-blue-900">{call.number}</TableCell>
                          <TableCell className="text-blue-900 flex items-center">
                            {getCallTypeIcon(call.type)}
                            {formatCallType(call.type)}
                          </TableCell>
                          <TableCell className="text-blue-900">{call.formattedtime}</TableCell>
                          <TableCell className="text-blue-900">{call.formattedduration}</TableCell>
                          <TableCell className="text-blue-900">{call.info}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                {filteredCalls.length > ITEMS_PER_PAGE && (
                  <div className="mt-4 flex justify-center items-center gap-4">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange("prev")}
                      disabled={currentPage === 1}
                      className="bg-blue-50 border-blue-200 text-blue-900"
                    >
                      Vorherige
                    </Button>
                    <span className="text-blue-900">
                      Seite {currentPage} von {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange("next")}
                      disabled={currentPage === totalPages}
                      className="bg-blue-50 border-blue-200 text-blue-900"
                    >
                      Nächste
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

