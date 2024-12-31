'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { FileDown, Euro, AlertCircle, Loader2, LayoutDashboard } from 'lucide-react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { createClient } from '@supabase/supabase-js'
import { useToast } from "@/components/ui/use-toast"
import Link from 'next/link'

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: unknown) => void;
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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
  payment_model: 'perMinute' | 'perCall' | 'custom'
  min_duration: number
  round_up_minutes: boolean
  per_minute_rate?: number
  per_call_rate?: number
  custom_rates?: { minDuration: number; maxDuration: number; rate: number }[]
  user_id: string
}

type MonthlyEntry = {
  projectId: string | null;
  projectName: string;
  calls: number;
  billableCalls: number;
  duration: number;
  amount: number;
}

type MonthlyData = {
  [key: string]: MonthlyEntry[];
}

const formatMonthYear = (dateString: string) => {
  const [year, month] = dateString.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleString('de-DE', { year: 'numeric', month: 'long' });
};

const parseGermanDate = (dateString: string): Date => {
  const [datePart, timePart] = dateString.split(', ');
  const [day, month, year] = datePart.split('.').map(Number);
  const [hours, minutes, seconds] = timePart.split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, seconds);
};

export default function MonthlyBilling() {
  const [calls, setCalls] = useState<Call[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [monthlyData, setMonthlyData] = useState<MonthlyData>({})
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  const { toast } = useToast()

  const loadData = useCallback(async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase.auth.getUser()
      if (profilesError) throw profilesError

      const userId = profiles.user?.id

      if (!userId) {
        throw new Error('Benutzer nicht gefunden')
      }

      const [projectsData, callsData] = await Promise.all([
        supabase.from('projects').select('*').eq('user_id', userId),
        supabase.from('calls').select('*').eq('user_id', userId)
      ]);
      
      if (projectsData.error) throw projectsData.error;
      if (callsData.error) throw callsData.error;

      const processedCalls = (callsData.data || []).map(call => ({
        ...call,
        Duration: parseDuration(call.formattedduration),
      }));

      const processedProjects = (projectsData.data || []).map(project => ({
        ...project,
        custom_rates: typeof project.custom_rates === 'string' 
          ? JSON.parse(project.custom_rates) 
          : project.custom_rates
      }));

      setCalls(processedCalls);
      setProjects(processedProjects);
      setError(null)
    } catch (error) {
      console.error('Fehler beim Laden der Daten:', error)
      setError('Fehler beim Laden der Daten. Bitte versuchen Sie es später erneut.')
      toast({
        id: "load-data-error",
        title: "Fehler",
        description: "Daten konnten nicht geladen werden.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setIsInitialLoad(false)
    }
  }, [toast])

  useEffect(() => {
    loadData()
  }, [loadData])

  const getProjectForCall = useCallback((call: Call): Project | undefined => {
    return projects.find(project => call.name.includes(project.internal_name));
  }, [projects]);

  useEffect(() => {
    if (!loading && calls.length > 0 && projects.length > 0) {
      const data: MonthlyData = {}
      calls.forEach(call => {
        const date = parseGermanDate(call.formattedtime);
        if (isNaN(date.getTime())) {
          console.error('Invalid date:', call.formattedtime);
          return;
        }
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!data[monthKey]) {
          data[monthKey] = []
        }
        const project = getProjectForCall(call)
        let entry = data[monthKey].find(e => e.projectId === (project ? project.id : null))
        if (!entry) {
          entry = {
            projectId: project ? project.id : null,
            projectName: project ? project.display_name : 'Nicht zugeordnete Anrufe',
            calls: 0,
            billableCalls: 0,
            duration: 0,
            amount: 0
          }
          data[monthKey].push(entry)
        }
        entry.calls += 1
        entry.duration += call.Duration || 0
        if (project && call.Duration && call.Duration > 0 && call.Duration >= project.min_duration) {
          entry.billableCalls += 1
          entry.amount += calculateAmount(project, call.Duration)
        }
      })
      setMonthlyData(data)
      const sortedMonths = Object.keys(data).sort().reverse();
      setSelectedMonth(sortedMonths[0] || '');
    }
  }, [calls, projects, loading, getProjectForCall]);

  const parseDuration = (formattedduration: string): number => {
    if (!formattedduration) return 0;
    const [minutes, seconds] = formattedduration.split(':').map(Number);
    return (minutes * 60) + (seconds || 0);
  }

  const calculateAmount = (project: Project, duration: number): number => {
    if (duration < project.min_duration) return 0;
    switch (project.payment_model) {
      case 'perMinute':
        const minutes = project.round_up_minutes ? Math.ceil(duration / 60) : duration / 60;
        return Math.floor(minutes * (project.per_minute_rate || 0));
      case 'perCall':
        return project.per_call_rate || 0;
      case 'custom':
        const sortedRates = [...(project.custom_rates || [])].sort((a, b) => a.maxDuration - b.maxDuration);
        for (const rate of sortedRates) {
          if (duration <= rate.maxDuration) {
            return rate.rate;
          }
        }
        return sortedRates.length > 0 ? sortedRates[sortedRates.length - 1].rate : 0;
      default:
        return 0;
    }
  }

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const formatCurrency = (cents: number): string => {
    return `${(cents / 100).toFixed(2)} €`;
  }

  const exportToPDF = async () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const monthDate = new Date(parseInt(selectedMonth.split('-')[0]), parseInt(selectedMonth.split('-')[1]) - 1, 1);
    const monthName = monthDate.toLocaleString('de-DE', { month: 'long', year: 'numeric' });
    const invoiceNumber = `INV-${selectedMonth}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
    const currentDate = new Date().toLocaleDateString('de-DE')

    // Load company data
    const savedCompanyData = localStorage.getItem('companyData')
    const companyData = savedCompanyData ? JSON.parse(savedCompanyData) : {
      name: 'Ihre Firma GmbH',
      street: 'Musterstraße 123',
      city: 'Musterstadt',
      zipCode: '12345',
      phone: '+49 123 456789',
      email: 'info@ihrefirma.de',
      website: 'www.ihrefirma.de'
    }

    const addHeader = () => {
      doc.setFillColor(248, 248, 248)
      doc.rect(0, 0, doc.internal.pageSize.width, 40, 'F')
      
      // Company name
      doc.setTextColor(60, 60, 60)
      doc.setFontSize(22)
      doc.setFont('helvetica', 'bold')
      doc.text(companyData.name, 14, 25)
      
      // Company details
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      const address = `${companyData.street}, ${companyData.zipCode} ${companyData.city}`
      doc.text(address, doc.internal.pageSize.width - 14, 15, { align: 'right' })
      doc.text(`Tel: ${companyData.phone}`, doc.internal.pageSize.width - 14, 20, { align: 'right' })
      doc.text(`E-Mail: ${companyData.email}`, doc.internal.pageSize.width - 14, 25, { align: 'right' })
      if (companyData.website) {
        doc.text(companyData.website, doc.internal.pageSize.width - 14, 30, { align: 'right' })
      }
    }

    const addInvoiceDetails = () => {
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(60, 60, 60)
      doc.text('Monatliche Abrechnung', 14, 55)
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(`Abrechnungszeitraum: ${monthName}`, 14, 65)
      doc.text(`Rechnungsnummer: ${invoiceNumber}`, 14, 70)
      doc.text(`Rechnungsdatum: ${currentDate}`, 14, 75)
    }

    const addFooter = () => {
      const pageCount = doc.internal.pages.length
      doc.setFontSize(8)
      doc.setTextColor(100)
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.text(`Seite ${i} von ${pageCount}`, 14, doc.internal.pageSize.height - 10)
        doc.text(`${companyData.name} • ${companyData.street} • ${companyData.zipCode} ${companyData.city}`, 
          doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' })
      }
    }

    // PDF-Erstellung
    addHeader()
    addInvoiceDetails()

    const tableColumn = ["Projektname", "Anrufe", "Abrechenbare Anrufe", "Gesamtdauer", "Betrag"]
    const tableRows = sortedMonthData.map(entry => [
      entry.projectName,
      entry.calls.toString(),
      entry.billableCalls.toString(),
      formatDuration(entry.duration),
      formatCurrency(entry.amount)
    ])

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 85,
      styles: { fontSize: 9, cellPadding: 1.5 },
      headStyles: { fillColor: [245, 245, 245], textColor: 60, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [252, 252, 252] },
      showFoot: false 
    })

    // Zusammenfassung
    const finalY = ((doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY) || 85
    doc.setFillColor(248, 248, 248)
    doc.rect(14, finalY + 10, doc.internal.pageSize.width - 28, 20, 'F')
    doc.setTextColor(60, 60, 60)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Anrufe gesamt: ${totalCalls}`, 20, finalY + 22)
    doc.text(`Abrechenbar: ${totals.billableCalls}`, 100, finalY + 22)
    doc.setFont('helvetica', 'bold')
    doc.text(`Summe: ${formatCurrency(totalAmount)}`, doc.internal.pageSize.width - 20, finalY + 22, { align: 'right' })

    addFooter()

    doc.save(`Monatliche_Abrechnung_${selectedMonth}.pdf`)
  }

  const availableMonths = Object.keys(monthlyData).sort().reverse().map(month => ({
    value: month,
    label: formatMonthYear(month)
  }));

  const selectedMonthData = monthlyData[selectedMonth] || [];
  const sortedMonthData = [...selectedMonthData].sort((a, b) => {
    if (a.projectId === null) return 1;
    if (b.projectId === null) return -1;
    return a.projectName.localeCompare(b.projectName);
  });

  const totals = selectedMonthData.reduce((acc, curr) => ({
    totalCalls: acc.totalCalls + curr.calls,
    billableCalls: acc.billableCalls + curr.billableCalls,
    totalDuration: acc.totalDuration + curr.duration,
    amount: acc.amount + curr.amount
  }), { totalCalls: 0, billableCalls: 0, totalDuration: 0, amount: 0 });

  const { totalCalls, amount: totalAmount } = totals;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 to-indigo-900">
      <header className="bg-blue-900/30 backdrop-blur-md shadow-lg border-b border-blue-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white tracking-tight">Monatliche Abrechnung</h1>
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
            <CardTitle className="text-2xl font-bold text-blue-900 flex items-center tracking-tight">
              <Euro className="mr-2 h-6 w-6 text-blue-600" />
              Abrechnungsübersicht
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-6">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[200px] bg-white border-gray-300 text-gray-700">
                  <SelectValue placeholder="Monat auswählen" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  {availableMonths.map(month => (
                    <SelectItem key={month.value} value={month.value} className="hover:bg-gray-100">
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                onClick={exportToPDF}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-md hover:shadow-lg"
              >
                <FileDown className="mr-2 h-4 w-4" />
                Als PDF exportieren
              </Button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
                    <TableHead className="text-blue-900 font-semibold text-lg">Projektname</TableHead>
                    <TableHead className="text-blue-900 font-semibold text-lg">Anrufe</TableHead>
                    <TableHead className="text-blue-900 font-semibold text-lg">Abrechenbare Anrufe</TableHead>
                    <TableHead className="text-blue-900 font-semibold text-lg">Gesamtdauer</TableHead>
                    <TableHead className="text-blue-900 font-semibold text-lg">Betrag</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isInitialLoad ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2 text-gray-500">
                          <Loader2 className="h-8 w-8 animate-spin" />
                          <p>Lade Daten...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2 text-gray-500">
                          <Loader2 className="h-8 w-8 animate-spin" />
                          <p>Aktualisiere Daten...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2 text-red-500">
                          <AlertCircle className="h-8 w-8" />
                          <p>{error}</p>
                          <Button onClick={loadData} variant="outline" size="sm" className="mt-2">
                            Erneut versuchen
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : selectedMonthData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2 text-gray-400">
                          <p>Keine Daten für den ausgewählten Monat verfügbar</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    <>
                      {sortedMonthData.map((entry, index) => (
                        <TableRow key={index} className="border-b border-blue-100 transition-colors duration-200 hover:bg-blue-50/50">
                          <TableCell className="text-blue-800">{entry.projectName}</TableCell>
                          <TableCell className="text-blue-800">{entry.calls}</TableCell>
                          <TableCell className="text-blue-800">{entry.billableCalls}</TableCell>
                          <TableCell className="text-blue-800">{formatDuration(entry.duration)}</TableCell>
                          <TableCell className="text-blue-800"><span className="text-blue-600 font-semibold">{formatCurrency(entry.amount)}</span></TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-bold bg-gradient-to-r from-blue-100 to-indigo-100">
                        <TableCell className="text-blue-900 text-lg">Gesamt</TableCell>
                        <TableCell className="text-blue-900 text-lg">{totals.totalCalls}</TableCell>
                        <TableCell className="text-blue-900 text-lg">{totals.billableCalls}</TableCell>
                        <TableCell className="text-blue-900 text-lg">{formatDuration(totals.totalDuration)}</TableCell>
                        <TableCell className="text-blue-900 text-lg"><span className="text-blue-700">{formatCurrency(totals.amount)}</span></TableCell>
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
  );
}

