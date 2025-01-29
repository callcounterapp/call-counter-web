"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { format, parse } from "date-fns"
import { de } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Euro, Clock, PhoneCall, PieChart } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabaseClient"
import Link from "next/link"
import { LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"

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
  billableMinutes?: number
}

export default function MonthlyStats() {
  const [calls, setCalls] = useState<Call[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("all")
  const [selectedDurationFilter, setSelectedDurationFilter] = useState("all")
  const [selectedTime, setSelectedTime] = useState<string>("all")
  const [monthOptions, setMonthOptions] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const { user } = useAuth()

  const parseDuration = useCallback((formattedduration: string): number => {
    if (!formattedduration) return 0
    const [minutes, seconds] = formattedduration.split(":").map(Number)
    return minutes * 60 + (seconds || 0)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) {
        console.log("Kein Benutzer gefunden")
        return
      }

      try {
        const [projectsData, callsData] = await Promise.all([
          supabase.from("projects").select("*").eq("user_id", user.id),
          supabase.from("calls").select("*").eq("user_id", user.id),
        ])

        if (projectsData.error) throw projectsData.error
        if (callsData.error) throw callsData.error

        const processedCalls = (callsData.data || []).map((call) => ({
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
            const date = parse(call.formattedtime.split(",")[0], "dd.MM.yyyy", new Date())
            options.add(format(date, "yyyy-MM"))
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
      }
    }

    fetchData()
  }, [user, parseDuration])

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

  const getDurationCategory = useCallback((duration: number): string => {
    if (duration < 30) return "0-30 Sek."
    if (duration < 60) return "31-60 Sek."
    if (duration < 120) return "1-2 Min."
    if (duration < 300) return "2-5 Min."
    return "5+ Min."
  }, [])

  const calculateStats = useCallback(
    (filteredCalls: Call[]) => {
      const userCalls = filteredCalls.filter((call) => call.user_id === user?.id)
      const userProjects = projects.filter((project) => project.user_id === user?.id)

      const calculateEarnings = (call: Call, project: Project): { earnings: number; billableSeconds: number } => {
        if (!project || !call.Duration) {
          return { earnings: 0, billableSeconds: 0 }
        }

        const duration = call.Duration // in Sekunden

        // Wenn die Dauer unter der Mindestdauer liegt, ist der Anruf nicht abrechenbar
        if (duration < project.min_duration) {
          return { earnings: 0, billableSeconds: 0 }
        }

        let earnings = 0
        const billableSeconds = duration // Tatsächliche Dauer für die Anzeige

        switch (project.payment_model) {
          case "perMinute":
            // Konvertiere in Minuten für die Berechnung
            let billableMinutes = duration / 60

            // Wenn Aufrundung aktiviert ist, runden wir für die Verdienstberechnung auf
            if (project.round_up_minutes) {
              billableMinutes = Math.ceil(billableMinutes)
            }

            // Berechne den Verdienst (rate ist bereits in Cent)
            earnings = Math.round(billableMinutes * (project.per_minute_rate || 0))
            break

          case "perCall":
            // Bei Vergütung pro Anruf ist der Betrag fix
            earnings = project.per_call_rate || 0
            break

          case "custom":
            if (project.custom_rates && project.custom_rates.length > 0) {
              const sortedRates = [...project.custom_rates].sort((a, b) => a.maxDuration - b.maxDuration)

              for (const rate of sortedRates) {
                if (duration >= rate.minDuration && duration <= rate.maxDuration) {
                  earnings = rate.rate // Rate ist bereits in Cent
                  break
                }
              }

              // Wenn die Dauer über allen Stufen liegt, verwende die höchste Stufe
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

        const durationDistribution = projectCalls.reduce(
          (acc, call) => {
            const category = getDurationCategory(call.Duration || 0)
            acc[category] = (acc[category] || 0) + 1
            return acc
          },
          {} as Record<string, number>,
        )

        const earningsDistribution = project.custom_rates
          ? project.custom_rates.map((rate) => ({
              range: `${rate.minDuration}-${rate.maxDuration} Sek.`,
              count: projectCalls.filter(
                (call) =>
                  call.Duration != null && call.Duration >= rate.minDuration && call.Duration <= rate.maxDuration,
              ).length,
              earnings: projectCalls
                .filter(
                  (call) =>
                    call.Duration != null && call.Duration >= rate.minDuration && call.Duration <= rate.maxDuration,
                )
                .reduce((sum, call) => sum + calculateEarnings(call, project).earnings, 0),
            }))
          : []

        return {
          ...project,
          totalCalls,
          billableCalls,
          totalEarnings,
          totalDuration,
          totalBillableSeconds,
          durationDistribution,
          earningsDistribution,
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
        durationDistribution: unassignedCalls.reduce(
          (acc, call) => {
            const category = getDurationCategory(call.Duration || 0)
            acc[category] = (acc[category] || 0) + 1
            return acc
          },
          {} as Record<string, number>,
        ),
        earningsDistribution: [],
      }

      const allStats = [...projectStats, unassignedStats]
      return allStats
    },
    [user, projects, getProjectForCall, getDurationCategory],
  )

  const projectStats = useMemo(() => {
    console.log("Calculating project stats with:", { calls, projects, userId: user?.id })
    return calculateStats(calls)
  }, [calls, projects, user, calculateStats])

  const unassignedStats = useMemo(() => {
    const userCalls = calls.filter((call) => call.user_id === user?.id)
    const unassignedCalls = userCalls.filter((call) => !getProjectForCall(call))
    return {
      id: "unassigned",
      display_name: "Nicht zugeordnete Anrufe",
      totalCalls: unassignedCalls.length,
      billableCalls: 0,
      totalEarnings: 0,
      totalDuration: unassignedCalls.reduce((sum, call) => sum + (call.Duration || 0), 0),
      totalBillableSeconds: 0,
      durationDistribution: unassignedCalls.reduce(
        (acc, call) => {
          const category = getDurationCategory(call.Duration || 0)
          acc[category] = (acc[category] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      ),
      earningsDistribution: [],
    }
  }, [calls, user, getProjectForCall, getDurationCategory])

  const totalStats = useMemo(() => {
    let filteredCalls = calls.filter((call) => call.user_id === user?.id)
    if (selectedTime === "daily" && selectedDate) {
      filteredCalls = filteredCalls.filter((call) => {
        const callDate = parse(call.formattedtime.split(",")[0], "dd.MM.yyyy", new Date())
        return format(callDate, "dd.MM.yyyy") === format(selectedDate, "dd.MM.yyyy")
      })
    } else if (selectedTime !== "all") {
      filteredCalls = filteredCalls.filter((call) => {
        const callDate = parse(call.formattedtime.split(",")[0], "dd.MM.yyyy", new Date())
        return format(callDate, "yyyy-MM") === selectedTime
      })
    }
    const stats = calculateStats(filteredCalls)
    return {
      totalCalls: filteredCalls.length,
      billableCalls: stats.reduce((sum, stat) => sum + stat.billableCalls, 0),
      totalEarnings: stats.reduce((sum, stat) => sum + stat.totalEarnings, 0),
      totalDuration: filteredCalls.reduce((sum, call) => sum + (call.Duration || 0), 0),
      totalBillableSeconds: stats.reduce((sum, stat) => sum + stat.totalBillableSeconds, 0),
    }
  }, [calls, user, selectedTime, selectedDate, calculateStats])

  const activeStats = useMemo(() => {
    const projectsWithCalls = projectStats
      .filter((stat) => stat.totalCalls > 0)
      .map((stat) => ({
        ...stat,
        display_name: (stat as Project).display_name || (stat as Project).internal_name || "Unbenanntes Projekt",
      }))

    const result = [...projectsWithCalls]

    if (unassignedStats.totalCalls > 0 && !result.some((stat) => stat.id === "unassigned")) {
      result.push(unassignedStats)
    }

    return result
  }, [projectStats, unassignedStats])

  const filteredStats = useMemo(() => {
    let filteredCalls = calls
    if (selectedTime === "daily" && selectedDate) {
      filteredCalls = calls.filter((call) => {
        const callDate = parse(call.formattedtime.split(",")[0], "dd.MM.yyyy", new Date())
        return format(callDate, "dd.MM.yyyy") === format(selectedDate, "dd.MM.yyyy")
      })
    } else if (selectedTime !== "all") {
      filteredCalls = calls.filter((call) => {
        const callDate = parse(call.formattedtime.split(",")[0], "dd.MM.yyyy", new Date())
        return format(callDate, "yyyy-MM") === selectedTime
      })
    }

    if (activeTab === "all") {
      return calculateStats(filteredCalls)
    }
    return calculateStats(filteredCalls).filter((stat) => stat.id.toString() === activeTab)
  }, [activeTab, calls, selectedTime, selectedDate, calculateStats])

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
          <h1 className="text-3xl font-bold text-white tracking-tight">Monatliche Statistik</h1>
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
            <CardTitle className="text-2xl font-bold text-blue-900 flex items-center">Anrufe verwalten</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center space-x-4">
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger className="w-[200px] bg-white border-gray-300 text-gray-700">
                  <SelectValue placeholder="Zeitraum auswählen" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="all">Alle Zeiträume</SelectItem>
                  <SelectItem value="daily">Tägliche Ansicht</SelectItem>
                  {monthOptions.map((month) => (
                    <SelectItem key={month} value={month}>
                      {format(parse(month, "yyyy-MM", new Date()), "MMMM yyyy", { locale: de })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTime === "daily" && (
                <div className="relative z-10">
                  <input
                    type="date"
                    value={selectedDate ? format(selectedDate, "yyyy-MM-dd") : ""}
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
            </div>
            <div className="text-lg font-semibold text-blue-800 mb-4">
              {selectedTime === "all"
                ? "Alle Zeiträume"
                : selectedTime === "daily"
                  ? `Tägliche Ansicht: ${selectedDate ? format(selectedDate, "dd.MM.yyyy") : "Kein Datum ausgewählt"}`
                  : `Monatliche Ansicht: ${format(parse(selectedTime, "yyyy-MM", new Date()), "MMMM yyyy", { locale: de })}`}
            </div>
            <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList key="tabsList" className="bg-blue-50 p-1 rounded-lg flex flex-wrap gap-2">
                <TabsTrigger
                  value="all"
                  className="px-4 py-2 rounded-md text-sm font-medium transition-colors text-blue-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  Alle Anrufe
                </TabsTrigger>
                {activeStats.map((stat) => (
                  <TabsTrigger
                    key={`tab-${stat.id}`}
                    value={stat.id.toString()}
                    className="px-4 py-2 rounded-md text-sm font-medium transition-colors text-blue-700 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  >
                    {stat.display_name}
                  </TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value="all">
                <div className="overflow-x-auto rounded-lg border border-blue-200">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-blue-200 bg-blue-50">
                        <TableHead className="text-blue-900 font-semibold">Projekt</TableHead>
                        <TableHead className="text-blue-900 font-semibold">Gesamtanrufe</TableHead>
                        <TableHead className="text-blue-900 font-semibold">Abrechenbare Anrufe</TableHead>
                        <TableHead className="text-blue-900 font-semibold">Gesamtdauer</TableHead>
                        <TableHead className="text-blue-900 font-semibold">Abrechenbare Zeit</TableHead>
                        <TableHead className="text-blue-900 font-semibold">Gesamtverdienst</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStats.map((stat) => (
                        <TableRow key={`row-${stat.id}`} className="border-b border-blue-100">
                          <TableCell className="font-medium text-blue-800">{stat.display_name}</TableCell>
                          <TableCell className="text-blue-800">{stat.totalCalls}</TableCell>
                          <TableCell className="text-blue-800">{stat.billableCalls}</TableCell>
                          <TableCell className="text-blue-800">{formatDuration(stat.totalDuration)}</TableCell>
                          <TableCell className="text-blue-800">{formatDuration(stat.totalBillableSeconds)}</TableCell>
                          <TableCell className="text-blue-800">
                            <span className="text-blue-600 font-semibold">{formatCurrency(stat.totalEarnings)}</span>
                          </TableCell>
                        </TableRow>
                      ))}
                      {totalStats && (
                        <TableRow className="font-bold border-t border-blue-200 bg-blue-50">
                          <TableCell className="text-blue-900">Gesamt</TableCell>
                          <TableCell className="text-blue-900">{totalStats.totalCalls}</TableCell>
                          <TableCell className="text-blue-900">{totalStats.billableCalls}</TableCell>
                          <TableCell className="text-blue-900">{formatDuration(totalStats.totalDuration)}</TableCell>
                          <TableCell className="text-blue-900">
                            {formatDuration(totalStats.totalBillableSeconds)}
                          </TableCell>
                          <TableCell className="text-blue-900">
                            <span className="text-blue-700">{formatCurrency(totalStats.totalEarnings)}</span>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              {filteredStats.map((stat) => (
                <TabsContent key={stat.id} value={stat.id.toString()}>
                  <div className="space-y-6">
                    <Card className="bg-white shadow-lg border-blue-200/50">
                      <CardHeader>
                        <CardTitle className="text-xl font-bold text-blue-900">
                          {stat.display_name} - Übersicht
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <StatCard
                            icon={<PhoneCall className="h-6 w-6 text-blue-400" />}
                            title="Anrufübersicht"
                            items={[
                              { label: "Gesamtanrufe", value: stat.totalCalls },
                              { label: "Abrechenbare Anrufe", value: stat.billableCalls },
                              { label: "Nicht abrechenbare Anrufe", value: stat.totalCalls - stat.billableCalls },
                            ]}
                          />
                          <StatCard
                            icon={<Clock className="h-6 w-6 text-green-400" />}
                            title="Zeitstatistiken"
                            items={[
                              { label: "Gesamtdauer", value: formatDuration(stat.totalDuration) },
                              {
                                label: "Abrechenbare Zeit",
                                value: formatDuration(stat.totalBillableSeconds),
                              },
                            ]}
                          />
                          <StatCard
                            icon={<Euro className="h-6 w-6 text-yellow-400" />}
                            title="Finanzielle Übersicht"
                            items={[{ label: "Gesamtverdienst", value: formatCurrency(stat.totalEarnings) }]}
                          />
                          {stat.id !== "unassigned" && "payment_model" in stat && (
                            <StatCard
                              icon={<PieChart className="h-6 w-6 text-purple-400" />}
                              title="Vergütungsmodell"
                              items={[
                                {
                                  label: "Modell",
                                  value:
                                    stat.payment_model === "custom"
                                      ? "Benutzerdefiniert"
                                      : stat.payment_model === "perMinute"
                                        ? "Pro Minute"
                                        : stat.payment_model === "perCall"
                                          ? "Pro Anruf"
                                          : "Unbekannt",
                                },
                                ...(stat.payment_model === "custom"
                                  ? stat.custom_rates?.map((rate) => ({
                                      label: `${rate.minDuration} - ${rate.maxDuration} Sek.`,
                                      value: formatCurrency(rate.rate),
                                    })) || []
                                  : stat.payment_model === "perMinute"
                                    ? [
                                        {
                                          label: "Vergütung pro Minute",
                                          value: formatCurrency(stat.per_minute_rate || 0),
                                        },
                                      ]
                                    : stat.payment_model === "perCall"
                                      ? [
                                          {
                                            label: "Vergütung pro Anruf",
                                            value: formatCurrency(stat.per_call_rate || 0),
                                          },
                                        ]
                                      : []),
                                { label: "Mindestdauer für Abr.", value: `${stat.min_duration} Sek.` },
                                { label: "Minuten aufrunden", value: stat.round_up_minutes ? "Ja" : "Nein" },
                              ]}
                            />
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white shadow-lg border-blue-200/50">
                      <CardHeader>
                        <CardTitle className="text-xl font-bold text-blue-900">Anrufverteilung nach Dauer</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {Object.entries(stat.durationDistribution).map(([category, count]) => (
                            <div key={category} className="bg-blue-50 p-4 rounded-lg shadow">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-medium text-blue-800">{category}</span>
                                <span className="text-sm text-blue-600">
                                  {count} Anrufe ({((count / stat.totalCalls) * 100).toFixed(1)}%)
                                </span>
                              </div>
                              <div className="w-full bg-blue-200 rounded-full h-2.5">
                                <div
                                  className="bg-blue-600 h-2.5 rounded-full"
                                  style={{ width: `${(count / stat.totalCalls) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {stat.id !== "unassigned" && "payment_model" in stat && stat.payment_model === "custom" && (
                      <Card className="bg-white shadow-lg border-blue-200/50">
                        <CardHeader>
                          <CardTitle className="text-xl font-bold text-blue-900">Vergütung nach Anrufdauer</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <Select value={selectedDurationFilter} onValueChange={setSelectedDurationFilter}>
                              <SelectTrigger className="w-full bg-white border-gray-300 text-gray-700">
                                <SelectValue placeholder="Wählen Sie einen Zeitraum" />
                              </SelectTrigger>
                              <SelectContent className="bg-white border-gray-200">
                                <SelectItem value="all" className="py-2 px-4 hover:bg-blue-50">
                                  Alle Anrufe
                                </SelectItem>
                                {stat.earningsDistribution.map((dist, index) => (
                                  <SelectItem
                                    key={index}
                                    value={dist.range}
                                    className="py-2 px-4 hover:bg-blue-50 whitespace-nowrap"
                                  >
                                    {dist.range}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow className="border-b border-blue-200 bg-blue-50">
                                    <TableHead className="text-blue-900">Dauer</TableHead>
                                    <TableHead className="text-blue-900">Anzahl Anrufe</TableHead>
                                    <TableHead className="text-blue-900">Gesamtverdienst</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {stat.earningsDistribution
                                    .filter(
                                      (dist) =>
                                        selectedDurationFilter === "all" || selectedDurationFilter === dist.range,
                                    )
                                    .map((dist, index) => (
                                      <TableRow key={index} className="border-b border-blue-100">
                                        <TableCell className="text-blue-800">{dist.range}</TableCell>
                                        <TableCell className="text-blue-800">{dist.count}</TableCell>
                                        <TableCell className="text-blue-800">{formatCurrency(dist.earnings)}</TableCell>
                                      </TableRow>
                                    ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

function StatCard({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode
  title: string
  items: { label: string; value: string | number }[]
}) {
  return (
    <Card className="overflow-hidden bg-blue-50 border-blue-200/50 shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="bg-blue-100/50 border-b border-blue-200/50">
        <CardTitle className="text-lg font-semibold flex items-center text-blue-900">
          {icon}
          <span className="ml-2">{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-blue-200">
          {items.map((item, index) => (
            <li
              key={index}
              className="flex justify-between items-center p-4 hover:bg-blue-100/50 transition-colors duration-200"
            >
              <span className="text-sm font-medium text-blue-700">{item.label}</span>
              <span className="text-sm font-semibold text-blue-900">{item.value}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

