"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { FileDown, Euro, Loader2, LayoutDashboard } from "lucide-react"
import jsPDF from "jspdf"
import "jspdf-autotable"
import { createClient } from "@supabase/supabase-js"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: unknown) => void
  }
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface Call {
  id: number
  type: string
  name: string
  number: string
  formattedtime: string
  formattedduration: string
  info: string
  Duration?: number
  user_id: string
}

interface Project {
  id: string
  internal_name: string
  display_name: string
  payment_model: "perMinute" | "perCall" | "custom"
  min_duration: number
  round_up_minutes: boolean
  per_minute_rate?: number
  per_call_rate?: number
  custom_rates?: { minDuration: number; maxDuration: number; rate: number }[]
  user_id: string
}

export default function MonthlyBilling() {
  const [calls, setCalls] = useState<Call[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string>("all")
  const [monthOptions, setMonthOptions] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [hasCompanyData, setHasCompanyData] = useState(false)
  const { user } = useAuth()

  const { toast } = useToast()

  const parseDuration = useCallback((formattedduration: string): number => {
    if (!formattedduration) return 0
    const [minutes, seconds] = formattedduration.split(":").map(Number)
    return minutes * 60 + (seconds || 0)
  }, [])

  const parseDate = useCallback((dateString: string): Date => {
    const [datePart, timePart] = dateString.split(", ")
    const [day, month, year] = datePart.split(".").map(Number)
    const [hours, minutes, seconds] = timePart ? timePart.split(":").map(Number) : [0, 0, 0]
    return new Date(year, month - 1, day, hours, minutes, seconds)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) {
        console.log("Kein Benutzer gefunden")
        return
      }

      try {
        const fetchAllCalls = async () => {
          let allCalls: Call[] = []
          let count = 0
          const { count: totalCount } = await supabase
            .from("calls")
            .select("*", { count: "exact" })
            .eq("user_id", user.id)

          const actualCount = totalCount ?? 0

          while (count < actualCount) {
            const { data, error } = await supabase
              .from("calls")
              .select("*")
              .eq("user_id", user.id)
              .range(count, count + 999)
              .order("id", { ascending: false })

            if (error) throw error
            if (!data) break

            allCalls = [...allCalls, ...data]
            count += 1000
          }
          return allCalls
        }

        const [projectsData, callsData] = await Promise.all([
          supabase.from("projects").select("*").eq("user_id", user.id),
          fetchAllCalls(),
        ])

        if (projectsData.error) throw projectsData.error

        console.log("Tatsächliche Anzahl der abgerufenen Anrufe:", callsData.length)

        const processedCalls = (callsData || []).map((call) => ({
          ...call,
          Duration: parseDuration(call.formattedduration),
          internal_name: call.name,
        }))

        const processedProjects = (projectsData.data || []).map((project) => ({
          ...project,
          custom_rates:
            typeof project.custom_rates === "string" ? JSON.parse(project.custom_rates) : project.custom_rates,
        }))

        setCalls(processedCalls)
        setProjects(processedProjects)

        const options = new Set<string>()
        processedCalls.forEach((call) => {
          if (call.formattedtime) {
            const callDate = parseDate(call.formattedtime)
            options.add(callDate.toISOString().slice(0, 7))
          }
        })
        const sortedOptions = Array.from(options).sort().reverse()
        setMonthOptions(sortedOptions)

        if (sortedOptions.length > 0) {
          setSelectedTime(sortedOptions[0])
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        setError("Fehler beim Laden der Daten")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, parseDuration, parseDate])

  const formatDuration = (duration: number): string => {
    if (!duration && duration !== 0) return "0:00"
    const hours = Math.floor(duration / 3600)
    const minutes = Math.floor((duration % 3600) / 60)
    const seconds = duration % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const formatCurrency = (amount: number): string => {
    return (amount / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" })
  }

  const getProjectForCall = useCallback(
    (call: Call): Project | undefined => {
      if (!call.name) {
        return undefined
      }
      return projects.find((project) => call.name.includes(project.internal_name))
    },
    [projects],
  )

  const calculateStats = useCallback(
    (filteredCalls: Call[]) => {
      const userCalls = filteredCalls.filter((call) => call.user_id === user?.id)
      const userProjects = projects.filter((project) => project.user_id === user?.id)

      const calculateEarnings = (call: Call, project: Project): { earnings: number; billableSeconds: number } => {
        if (!project || !call.Duration) {
          return { earnings: 0, billableSeconds: 0 }
        }

        const duration = call.Duration // in Sekunden

        if (duration < project.min_duration) {
          return { earnings: 0, billableSeconds: 0 }
        }

        let earnings = 0
        const billableSeconds = duration

        switch (project.payment_model) {
          case "perMinute":
            let billableMinutes = duration / 60

            if (project.round_up_minutes) {
              billableMinutes = Math.ceil(billableMinutes)
            }

            earnings = Math.round(billableMinutes * (project.per_minute_rate || 0))
            break

          case "perCall":
            earnings = project.per_call_rate || 0
            break

          case "custom":
            if (project.custom_rates && project.custom_rates.length > 0) {
              const sortedRates = [...project.custom_rates].sort((a, b) => a.maxDuration - b.maxDuration)

              for (const rate of sortedRates) {
                if (duration >= rate.minDuration && duration <= rate.maxDuration) {
                  earnings = rate.rate
                  break
                }
              }

              if (duration > sortedRates[sortedRates.length - 1].maxDuration) {
                earnings = sortedRates[sortedRates.length - 1].rate
              }
            }
            break
        }

        return { earnings, billableSeconds }
      }

      const projectStats = userProjects.map((project) => {
        const projectCalls = userCalls.filter((call) => {
          const matchingProject = getProjectForCall(call)
          return matchingProject?.id === project.id
        })

        let totalEarnings = 0
        let totalBillableSeconds = 0
        const totalCalls = projectCalls.length
        const totalDuration = projectCalls.reduce((sum, call) => sum + (call.Duration || 0), 0)
        const billableCalls = projectCalls.filter((call) => {
          const { earnings, billableSeconds } = calculateEarnings(call, project)
          if (earnings > 0) {
            totalEarnings += earnings
            totalBillableSeconds += billableSeconds
            return true
          }
          return false
        }).length

        return {
          ...project,
          totalCalls,
          billableCalls,
          totalEarnings,
          totalDuration,
          totalBillableSeconds,
        }
      })

      const unassignedCalls = userCalls.filter((call) => !getProjectForCall(call))
      const unassignedStats = {
        id: "unassigned",
        display_name: "Nicht zugeordnete Anrufe",
        totalCalls: unassignedCalls.length,
        billableCalls: 0,
        totalEarnings: 0,
        totalDuration: unassignedCalls.reduce((sum, call) => sum + (call.Duration || 0), 0),
        totalBillableSeconds: 0,
      }

      const allStats = [...projectStats, unassignedStats]
      return allStats
    },
    [user, projects, getProjectForCall],
  )

  const filteredStats = useMemo(() => {
    let filteredCalls = calls
    if (selectedTime === "daily" && selectedDate) {
      filteredCalls = calls.filter((call) => {
        const callDate = parseDate(call.formattedtime)
        const compareDate = new Date(selectedDate)

        // Set both dates to the start of the day for accurate comparison
        callDate.setHours(0, 0, 0, 0)
        compareDate.setHours(0, 0, 0, 0)

        return callDate.getTime() === compareDate.getTime()
      })
    } else if (selectedTime !== "all") {
      filteredCalls = calls.filter((call) => {
        const callDate = parseDate(call.formattedtime)
        return callDate.toISOString().slice(0, 7) === selectedTime
      })
    }

    return calculateStats(filteredCalls)
  }, [calls, selectedTime, selectedDate, calculateStats, parseDate])

  const totals = useMemo(() => {
    return filteredStats.reduce(
      (acc, stat) => ({
        totalCalls: acc.totalCalls + stat.totalCalls,
        billableCalls: acc.billableCalls + stat.billableCalls,
        totalDuration: acc.totalDuration + stat.totalDuration,
        totalBillableSeconds: acc.totalBillableSeconds + stat.totalBillableSeconds,
        totalEarnings: acc.totalEarnings + stat.totalEarnings,
      }),
      { totalCalls: 0, billableCalls: 0, totalDuration: 0, totalBillableSeconds: 0, totalEarnings: 0 },
    )
  }, [filteredStats])

  const exportToPDF = async () => {
    try {
      console.log("Starting PDF export process")
      const { data: profiles, error: profilesError } = await supabase.auth.getUser()
      if (profilesError) {
        console.error("Error fetching user:", profilesError)
        throw new Error(`Fehler beim Abrufen des Benutzers: ${profilesError.message}`)
      }

      const userId = profiles.user?.id

      if (!userId) {
        console.error("User not found")
        throw new Error("Benutzer nicht gefunden")
      }

      console.log("Fetching company data")
      const { data: companyDataResponse, error: companyDataError } = await supabase
        .from("firma_daten")
        .select("*")
        .eq("user_id", userId)

      if (companyDataError) {
        console.error("Error fetching company data:", companyDataError)
        throw new Error(`Fehler beim Abrufen der Firmendaten: ${companyDataError.message}`)
      }

      if (!companyDataResponse || companyDataResponse.length === 0) {
        console.error("No company data found")
        toast({
          id: "company-data-error",
          title: "Fehler",
          description: "Bitte fügen Sie zuerst Ihre Firmendaten in den Einstellungen hinzu.",
          variant: "destructive",
        })
        throw new Error("Bitte fügen Sie zuerst Ihre Firmendaten in den Einstellungen hinzu")
      }

      const firstCompanyData = companyDataResponse[0]

      console.log("Initializing jsPDF")
      const doc = new jsPDF("p", "mm", "a4")
      const monthDate = new Date(
        Number.parseInt(selectedTime.split("-")[0]),
        Number.parseInt(selectedTime.split("-")[1]) - 1,
        1,
      )
      const monthName = monthDate.toLocaleString("de-DE", { month: "long", year: "numeric" })
      const invoiceNumber = `INV-${selectedTime}-${Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0")}`
      const currentDate = new Date().toLocaleDateString("de-DE")

      console.log("Adding header to PDF")
      const addHeader = () => {
        doc.setFillColor(248, 248, 248)
        doc.rect(0, 0, doc.internal.pageSize.width, 40, "F")

        doc.setTextColor(60, 60, 60)
        doc.setFontSize(22)
        doc.setFont("helvetica", "bold")
        doc.text(firstCompanyData.name, 14, 25)

        doc.setFontSize(10)
        doc.setFont("helvetica", "normal")
        const address = `${firstCompanyData.strasse}, ${firstCompanyData.plz} ${firstCompanyData.stadt}`
        doc.text(address, doc.internal.pageSize.width - 14, 15, { align: "right" })
        doc.text(`Tel: ${firstCompanyData.telefon}`, doc.internal.pageSize.width - 14, 20, { align: "right" })
        doc.text(`E-Mail: ${firstCompanyData.email}`, doc.internal.pageSize.width - 14, 25, { align: "right" })
        if (firstCompanyData.webseite) {
          doc.text(firstCompanyData.webseite, doc.internal.pageSize.width - 14, 30, { align: "right" })
        }
      }

      console.log("Adding invoice details to PDF")
      const addInvoiceDetails = () => {
        doc.setFontSize(18)
        doc.setFont("helvetica", "bold")
        doc.setTextColor(60, 60, 60)
        doc.text("Monatliche Abrechnung", 14, 55)

        doc.setFontSize(10)
        doc.setFont("helvetica", "normal")
        doc.text(`Abrechnungszeitraum: ${monthName}`, 14, 65)
        doc.text(`Rechnungsnummer: ${invoiceNumber}`, 14, 70)
        doc.text(`Rechnungsdatum: ${currentDate}`, 14, 75)
      }

      console.log("Adding footer to PDF")
      const addFooter = () => {
        const pageCount = doc.internal.pages.length
        doc.setFontSize(8)
        doc.setTextColor(100)
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i)
          doc.text(`Seite ${i} von ${pageCount}`, 14, doc.internal.pageSize.height - 10)
          doc.text(
            `${firstCompanyData.name} • ${firstCompanyData.strasse} • ${firstCompanyData.plz} ${firstCompanyData.stadt}`,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: "center" },
          )
        }
      }

      addHeader()
      addInvoiceDetails()

      console.log("Preparing table data")
      const tableColumn = ["Projektname", "Anrufe", "Abrechenbare Anrufe", "Gesamtdauer", "Abrechenbare Zeit", "Betrag"]
      const tableRows = filteredStats.map((stat) => [
        stat.display_name,
        stat.totalCalls.toString(),
        stat.billableCalls.toString(),
        formatDuration(stat.totalDuration),
        formatDuration(stat.totalBillableSeconds),
        formatCurrency(stat.totalEarnings),
      ])

      console.log("Adding table to PDF")
      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 85,
        styles: { fontSize: 9, cellPadding: 1.5 },
        headStyles: { fillColor: [245, 245, 245], textColor: 60, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [252, 252, 252] },
        showFoot: false,
      })

      console.log("Adding summary to PDF")
      const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 85
      doc.setFillColor(248, 248, 248)
      doc.rect(14, finalY + 10, doc.internal.pageSize.width - 28, 20, "F")
      doc.setTextColor(60, 60, 60)
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text(`Anrufe gesamt: ${totals.totalCalls}`, 20, finalY + 22)
      doc.text(`Abrechenbar: ${totals.billableCalls}`, 100, finalY + 22)
      doc.setFont("helvetica", "bold")
      doc.text(`Summe: ${formatCurrency(totals.totalEarnings)}`, doc.internal.pageSize.width - 20, finalY + 22, {
        align: "right",
      })

      addFooter()

      console.log("Saving PDF")
      doc.save(`Monatliche_Abrechnung_${selectedTime}.pdf`)

      console.log("PDF export completed successfully")
      toast({
        id: "pdf-export-success",
        title: "Erfolg",
        description: "PDF wurde erfolgreich erstellt und heruntergeladen.",
      })
    } catch (error) {
      console.error("Detailed error in PDF export:", error)
      let errorMessage = "PDF konnte nicht erstellt werden. "
      if (error instanceof Error) {
        errorMessage += error.message
      } else {
        errorMessage += "Unbekannter Fehler aufgetreten."
      }
      toast({
        id: "pdf-export-error",
        title: "Fehler",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    const checkCompanyData = async () => {
      if (!user?.id) return false

      const { data, error } = await supabase.from("firma_daten").select("*").eq("user_id", user.id)

      if (error) {
        console.error("Error checking company data:", error)
        return false
      }

      return data && data.length > 0
    }

    const checkData = async () => {
      const hasData = await checkCompanyData()
      setHasCompanyData(hasData)
    }

    if (user?.id) {
      checkData()
    }
  }, [user])

  if (error) {
    console.error("Fehler:", error)
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 to-indigo-900 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-sm border-blue-800/50">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white">Fehler beim Laden der Daten</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-100">{error}</p>
            <p className="text-blue-200 mt-2">Bitte überprüfen Sie:</p>
            <ul className="list-disc list-inside text-blue-200 mt-2">
              <li>Ihre Internetverbindung</li>
              <li>Ob Sie angemeldet sind</li>
              <li>Ob Projekte angelegt wurden</li>
              <li>Ob Anrufe importiert wurden</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 to-indigo-900">
      <header className="bg-blue-900/30 backdrop-blur-md shadow-lg border-b border-blue-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white tracking-tight">Monatliche Abrechnung</h1>
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
            <CardTitle className="text-2xl font-bold text-blue-900 flex items-center tracking-tight">
              <Euro className="mr-2 h-6 w-6 text-blue-600" />
              Abrechnungsübersicht
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-6">
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger className="w-[200px] bg-white border-gray-300 text-gray-700">
                  <SelectValue placeholder="Monat auswählen" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="all">Alle Zeiträume</SelectItem>
                  <SelectItem value="daily">Tägliche Ansicht</SelectItem>
                  {monthOptions.map((month) => (
                    <SelectItem key={month} value={month}>
                      {new Date(month).toLocaleString("de-DE", { month: "long", year: "numeric" })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTime === "daily" && (
                <div className="relative z-10">
                  <input
                    type="date"
                    value={selectedDate ? selectedDate.toISOString().split("T")[0] : ""}
                    onChange={(e) => {
                      const date = e.target.valueAsDate
                      if (date) {
                        setSelectedDate(date)
                      }
                    }}
                    className="w-[200px] bg-white border border-gray-300 rounded-md p-2 text-gray-700"
                  />
                </div>
              )}
              <Button
                onClick={exportToPDF}
                disabled={!hasCompanyData}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileDown className="mr-2 h-4 w-4" />
                {hasCompanyData ? "Als PDF exportieren" : "Firmendaten fehlen"}
              </Button>
              {!hasCompanyData && (
                <div className="mt-2 text-sm text-red-600">
                  Bitte fügen Sie zuerst Ihre Firmendaten in den Einstellungen hinzu, bevor Sie ein PDF exportieren.
                </div>
              )}
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
                    <TableHead className="text-blue-900 font-semibold text-lg">Projektname</TableHead>
                    <TableHead className="text-blue-900 font-semibold text-lg">Anrufe</TableHead>
                    <TableHead className="text-blue-900 font-semibold text-lg">Abrechenbare Anrufe</TableHead>
                    <TableHead className="text-blue-900 font-semibold text-lg">Gesamtdauer</TableHead>
                    <TableHead className="text-blue-900 font-semibold text-lg">Abrechenbare Zeit</TableHead>
                    <TableHead className="text-blue-900 font-semibold text-lg">Betrag</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2 text-gray-500">
                          <Loader2 className="h-8 w-8 animate-spin" />
                          <p>Lade Daten...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredStats.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2 text-gray-400">
                          <p>Keine Daten für den ausgewählten Zeitraum verfügbar</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {filteredStats.map((stat, index) => (
                        <TableRow
                          key={index}
                          className="border-b border-blue-100 transition-colors duration-200 hover:bg-blue-50/50"
                        >
                          <TableCell className="text-blue-800">{stat.display_name}</TableCell>
                          <TableCell className="text-blue-800">{stat.totalCalls}</TableCell>
                          <TableCell className="text-blue-800">{stat.billableCalls}</TableCell>
                          <TableCell className="text-blue-800">{formatDuration(stat.totalDuration)}</TableCell>
                          <TableCell className="text-blue-800">{formatDuration(stat.totalBillableSeconds)}</TableCell>
                          <TableCell className="text-blue-800">
                            <span className="text-blue-600 font-semibold">{formatCurrency(stat.totalEarnings)}</span>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold bg-gradient-to-r from-blue-100 to-indigo-100">
                        <TableCell className="text-blue-900 text-lg">Gesamt</TableCell>
                        <TableCell className="text-blue-900 text-lg">{totals.totalCalls}</TableCell>
                        <TableCell className="text-blue-900 text-lg">{totals.billableCalls}</TableCell>
                        <TableCell className="text-blue-900 text-lg">{formatDuration(totals.totalDuration)}</TableCell>
                        <TableCell className="text-blue-900 text-lg">
                          {formatDuration(totals.totalBillableSeconds)}
                        </TableCell>
                        <TableCell className="text-blue-900 text-lg">
                          <span className="text-blue-700">{formatCurrency(totals.totalEarnings)}</span>
                        </TableCell>
                      </TableRow>
                    </>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

