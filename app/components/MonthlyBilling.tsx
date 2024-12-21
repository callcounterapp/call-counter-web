'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Button } from "./ui/button"
import { Label } from "./ui/label"
import { FileDown, Euro, ArrowLeft } from 'lucide-react'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from "./ui/use-toast"
import { useRouter } from 'next/navigation'

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

interface PdfEventCallback {
  (data: unknown): void;
}

interface PdfEvents {
  subscribe: (event: string, callback: PdfEventCallback) => void;
  unsubscribe: (event: string, callback: PdfEventCallback) => void;
  publish: (event: string, data: unknown) => void;
  getTopics: () => string[];
}

interface AutoTableOptions {
  head: string[][];
  body: string[][];
  startY: number;
  styles?: {
    fontSize?: number;
    cellPadding?: number;
  };
  headStyles?: {
    fillColor?: number[];
    textColor?: number;
    fontStyle?: string;
  };
  alternateRowStyles?: {
    fillColor?: number[];
  };
  showFoot?: boolean;
}

type ExtendedJsPDF = jsPDF & {
  autoTable: (options: AutoTableOptions) => void;
  internal: {
    pageSize: {
      width: number;
      height: number;
    };
    pages: string[];
    lastAutoTable?: {
      finalY: number;
    };
  };
};

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

  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', user.id);
        
        if (projectsError) throw projectsError;

        const { data: callsData, error: callsError } = await supabase
          .from('calls')
          .select('*')
          .eq('user_id', user.id);
        
        if (callsError) throw callsError;
        
        const processedCalls = (callsData || []).map(call => ({
          ...call,
          Duration: parseDuration(call.formattedduration),
          internal_name: call.name
        }));

        const processedProjects = (projectsData || []).map(project => ({
          ...project,
          custom_rates: typeof project.custom_rates === 'string' 
            ? JSON.parse(project.custom_rates) 
            : project.custom_rates
        }));

        setCalls(processedCalls);
        setProjects(processedProjects);
        
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Fehler beim Laden der Daten');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

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


  useEffect(() => {
    const getProjectForCall = (call: Call): Project | undefined => {
      return projects.find(project => call.name === project.internal_name);
    }

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
      if (project && (call.Duration || 0) >= project.min_duration) {
        entry.billableCalls += 1
        entry.amount += calculateAmount(project, call.Duration || 0)
      }
    })
    setMonthlyData(data)
    const sortedMonths = Object.keys(data).sort().reverse();
    setSelectedMonth(sortedMonths[0] || '');
  }, [calls, projects])

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const formatCurrency = (amount: number): string => {
    return (amount / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
  }

  const exportToPDF = async () => {
    const doc = new jsPDF() as ExtendedJsPDF
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
      const pageCount = doc.internal.pages.length -1;
      doc.setFontSize(8);
      doc.setTextColor(100);
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(`Seite ${i} von ${pageCount}`, 14, doc.internal.pageSize.height - 10);
        doc.text(
          `${companyData.name} • ${companyData.street} • ${companyData.zipCode} ${companyData.city}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }
    };

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
    const finalY = doc.internal.lastAutoTable?.finalY || 85
    doc.setFillColor(248, 248, 248)
    doc.rect(14, finalY + 10, doc.internal.pageSize.width - 28, 20, 'F')
    doc.setTextColor(60, 60, 60)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Anrufe gesamt: ${totalCalls}`, 20, finalY + 22)
    doc.text(`Abrechenbar: ${totalBillableCalls}`, 100, finalY + 22)
    doc.setFont('helvetica', 'bold')
    doc.text(`Summe: ${formatCurrency(totalAmount)}`, doc.internal.pageSize.width - 20, finalY + 22, { align: 'right' })

    addFooter()

    doc.save(`Monatliche_Abrechnung_${selectedMonth}.pdf`)
  }

  if (loading) return <div>Lade Daten...</div>
  if (error) {
    toast({
      variant: "destructive",
      title: "Fehler beim Laden der Daten",
      description: error,
    })
    return null
  }

  const selectedMonthData = monthlyData[selectedMonth] || []
  const sortedMonthData = [...selectedMonthData].sort((a, b) => {
    if (a.projectId === null) return 1;
    if (b.projectId === null) return -1;
    return a.projectName.localeCompare(b.projectName);
  });

  const totalCalls = selectedMonthData.reduce((sum, entry) => sum + entry.calls, 0)
  const totalBillableCalls = selectedMonthData.reduce((sum, entry) => sum + entry.billableCalls, 0)
  const totalDuration = selectedMonthData.reduce((sum, entry) => sum + entry.duration, 0)
  const totalAmount = selectedMonthData.reduce((sum, entry) => sum + entry.amount, 0)

  return (
    <div className="space-y-4">
      <div className="bg-white shadow-md rounded-lg mb-6">
        <div className="px-6 py-4 flex justify-between items-center">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Zurück
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Monatliche Abrechnung</h1>
          <div className="w-24"></div> {/* Spacer for alignment */}
        </div>
      </div>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center text-primary">
            <Euro className="mr-2" />
            Monatliche Abrechnung
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div className="w-64">
              <Label htmlFor="month-select">Monat auswählen</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger id="month-select">
                  <SelectValue placeholder="Wähle einen Monat">
                    {selectedMonth ? formatMonthYear(selectedMonth) : 'Wähle einen Monat'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(monthlyData).sort().reverse().map(month => (
                    <SelectItem key={month} value={month}>
                      {formatMonthYear(month)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={exportToPDF}>
              <FileDown className="mr-2 h-4 w-4" />
              Als PDF exportieren
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Projektname</TableHead>
                  <TableHead className="py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Anrufe</TableHead>
                  <TableHead className="py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Abrechenbare Anrufe</TableHead>
                  <TableHead className="py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gesamtdauer</TableHead>
                  <TableHead className="py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Betrag</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedMonthData.map((entry) => (
                  <TableRow key={entry.projectId || 'unassigned'} className="hover:bg-gray-50">
                    <TableCell className="py-4">{entry.projectName}</TableCell>
                    <TableCell className="py-4">{entry.calls}</TableCell>
                    <TableCell className="py-4">{entry.billableCalls}</TableCell>
                    <TableCell className="py-4">{formatDuration(entry.duration)}</TableCell>
                    <TableCell className="py-4">{formatCurrency(entry.amount)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold bg-gray-50">
                  <TableCell className="py-4">Gesamt</TableCell>
                  <TableCell className="py-4">{totalCalls}</TableCell>
                  <TableCell className="py-4">{totalBillableCalls}</TableCell>
                  <TableCell className="py-4">{formatDuration(totalDuration)}</TableCell>
                  <TableCell className="py-4">{formatCurrency(totalAmount)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

