'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { format, parse } from 'date-fns'
import { de } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Euro, Clock, PhoneCall, PieChart } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { LayoutDashboard } from 'lucide-react'
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
  payment_model: 'perMinute' | 'perCall' | 'custom'
  min_duration: number
  round_up_minutes: boolean
  per_minute_rate?: number
  per_call_rate?: number
  custom_rates?: { minDuration: number; maxDuration: number; rate: number }[]
  user_id: string
}

export default function MonthlyStats() {
  const [calls, setCalls] = useState<Call[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('all')
  const [selectedDurationFilter, setSelectedDurationFilter] = useState('all')
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [monthOptions, setMonthOptions] = useState<string[]>([])
  const { user } = useAuth()

  const parseDuration = (formattedduration: string): number => {
    if (!formattedduration) return 0;
    const [minutes, seconds] = formattedduration.split(':').map(Number);
    return (minutes * 60) + (seconds || 0);
  }

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) {
        console.log('Kein Benutzer gefunden');
        return;
      }
      
      try {
        const [projectsData, callsData] = await Promise.all([
          supabase.from('projects').select('*').eq('user_id', user.id),
          supabase.from('calls').select('*').eq('user_id', user.id)
        ]);
        
        if (projectsData.error) throw projectsData.error;
        if (callsData.error) throw callsData.error;
        
        const processedCalls = (callsData.data || []).map(call => ({
          ...call,
          Duration: parseDuration(call.formattedduration),
          internal_name: call.name
        }));

        const processedProjects = (projectsData.data || []).map(project => ({
          ...project,
          custom_rates: typeof project.custom_rates === 'string' 
            ? JSON.parse(project.custom_rates) 
            : project.custom_rates
        }));
        
        setCalls(processedCalls);
        setProjects(processedProjects);
        
        const options = new Set<string>();
        processedCalls.forEach(call => {
          if (call.formattedtime) {
            const date = parse(call.formattedtime.split(',')[0], 'dd.MM.yyyy', new Date());
            options.add(format(date, 'yyyy-MM'));
          }
        });
        const sortedOptions = Array.from(options).sort().reverse();
        setMonthOptions(sortedOptions);
        
        if (sortedOptions.length > 0) {
          setSelectedMonth(sortedOptions[0]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Fehler beim Laden der Daten');
      }
    };

    fetchData();
  }, [user]);

  const formatDuration = (duration: number): string => {
    if (!duration && duration !== 0) return '-';
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatCurrency = (amount: number): string => {
    return (amount / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
  }

  const getProjectForCall = useCallback((call: Call): Project | undefined => {
    if (!call.name) {
      console.log(`Call ${call.id} has no name`);
      return undefined;
    }
    
    const callName = call.name.toLowerCase();
    
    const project = projects.find(project => {
      const projectName = project.internal_name.toLowerCase();
      return callName.includes(projectName);
    });
    
    console.log(`Looking for project with name ${call.name}:`, project);
    return project;
  }, [projects]);

  const calculateStats = useCallback((filteredCalls: Call[]) => {
    const userCalls = filteredCalls.filter(call => call.user_id === user?.id);
    const userProjects = projects.filter(project => project.user_id === user?.id);

    const calculateEarnings = (call: Call, project: Project): number => {
      if (!project || !call.Duration) {
        console.log('No project found for call or no duration:', call);
        return 0;
      }

      const duration = call.Duration;
      
      if (duration < project.min_duration) {
        console.log(`Duration ${duration}s is less than minimum ${project.min_duration}s`);
        return 0;
      }

      let earnings = 0;
      switch (project.payment_model) {
        case 'perMinute':
          const minutes = project.round_up_minutes ? 
            Math.ceil(duration / 60) : 
            Math.floor(duration / 60) + (duration % 60) / 60;
          earnings = Math.floor(minutes * (project.per_minute_rate || 0));
          console.log('Per minute calculation:', { minutes, rate: project.per_minute_rate, earnings });
          break;

        case 'perCall':
          earnings = project.per_call_rate || 0;
          console.log('Per call calculation:', { rate: project.per_call_rate, earnings });
          break;

        case 'custom':
          if (project.custom_rates && project.custom_rates.length > 0) {
            const sortedRates = [...project.custom_rates].sort((a, b) => a.maxDuration - b.maxDuration);
            console.log('Custom rates:', sortedRates);

            for (const rate of sortedRates) {
              if (duration >= rate.minDuration && duration <= rate.maxDuration) {
                earnings = rate.rate;
                console.log(`Found matching rate: ${rate.rate} for duration ${duration}s`);
                break;
              }
            }

            if (earnings === 0 && sortedRates.length > 0) {
              const highestRate = sortedRates[sortedRates.length - 1];
              if (duration > highestRate.maxDuration) {
                earnings = highestRate.rate;
                console.log(`Using highest rate: ${highestRate.rate} for duration ${duration}s`);
              }
            }
          }
          break;
      }

      console.log(`Final earnings for call ${call.id}: ${earnings} cents`);
      return earnings;
    };

    const projectStats = userProjects.map(project => {
      const projectCalls = userCalls.filter(call => {
        const matchingProject = getProjectForCall(call);
        return matchingProject?.id === project.id;
      });

      let totalEarnings = 0;
      const totalCalls = projectCalls.length;
      const totalDuration = projectCalls.reduce((sum, call) => sum + (call.Duration || 0), 0);
      const billableCalls = projectCalls.filter(call => {
        const earnings = calculateEarnings(call, project);
        if (earnings > 0) {
          totalEarnings += earnings;
          return true;
        }
        return false;
      }).length;

      const durationDistribution = projectCalls.reduce((acc, call) => {
        const category = getDurationCategory(call.Duration || 0)
        acc[category] = (acc[category] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const earningsDistribution = project.custom_rates ? project.custom_rates.map(rate => ({
        range: `${rate.minDuration}-${rate.maxDuration} Sek.`,
        count: projectCalls.filter(call => call.Duration != null && call.Duration >= rate.minDuration && call.Duration <= rate.maxDuration).length,
        earnings: projectCalls.filter(call => call.Duration != null && call.Duration >= rate.minDuration && call.Duration <= rate.maxDuration)
                           .reduce((sum, call) => sum + calculateEarnings(call, project), 0)
      })) : []

      return { 
        ...project, 
        totalCalls, 
        billableCalls, 
        totalEarnings, 
        totalDuration,
        durationDistribution,
        earningsDistribution
      }
    })

    const unassignedCalls = userCalls.filter(call => !getProjectForCall(call))
    const unassignedStats = {
      id: 'unassigned',
      display_name: 'Nicht zugeordnete Anrufe',
      totalCalls: unassignedCalls.length,
      billableCalls: 0,
      totalEarnings: 0,
      totalDuration: unassignedCalls.reduce((sum, call) => sum + (call.Duration || 0), 0),
      durationDistribution: unassignedCalls.reduce((acc, call) => {
        const category = getDurationCategory(call.Duration || 0)
        acc[category] = (acc[category] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      earningsDistribution: []
    }

    const allStats = [...projectStats, unassignedStats];
    return allStats;
  }, [user, projects, getProjectForCall]);

  const getDurationCategory = (duration: number): string => {
    if (duration < 30) return '0-30 Sek.'
    if (duration < 60) return '31-60 Sek.'
    if (duration < 120) return '1-2 Min.'
    if (duration < 300) return '2-5 Min.'
    return '5+ Min.'
  }

  const projectStats = useMemo(() => {
    console.log('Calculating project stats with:', { calls, projects, userId: user?.id });
    return calculateStats(calls);
  }, [calls, projects, user, calculateStats])

  const unassignedStats = useMemo(() => {
    const userCalls = calls.filter(call => call.user_id === user?.id);
    const unassignedCalls = userCalls.filter(call => !getProjectForCall(call))
    return {
      id: 'unassigned',
      display_name: 'Nicht zugeordnete Anrufe',
      totalCalls: unassignedCalls.length,
      billableCalls: 0,
      totalEarnings: 0,
      totalDuration: unassignedCalls.reduce((sum, call) => sum + (call.Duration || 0), 0),
      durationDistribution: unassignedCalls.reduce((acc, call) => {
        const category = getDurationCategory(call.Duration || 0)
        acc[category] = (acc[category] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      earningsDistribution: []
    }
  }, [calls, user, getProjectForCall])

  const totalStats = useMemo(() => ({
    totalCalls: calls.filter(call => call.user_id === user?.id).length,
    billableCalls: projectStats.reduce((sum, stat) => sum + stat.billableCalls, 0),
    totalEarnings: projectStats.reduce((sum, stat) => sum + stat.totalEarnings, 0),
    totalDuration: calls.filter(call => call.user_id === user?.id).reduce((sum, call) => sum + (call.Duration || 0), 0),
  }), [calls, projectStats, user])

  const activeStats = useMemo(() => {
    const projectsWithCalls = projectStats
      .filter(stat => stat.totalCalls > 0)
      .map(stat => ({
        ...stat,
        display_name: (stat as Project).display_name || (stat as Project).internal_name || 'Unbenanntes Projekt'
      }));

    const result = [...projectsWithCalls];

    if (unassignedStats.totalCalls > 0 && !result.some(stat => stat.id === 'unassigned')) {
      result.push(unassignedStats);
    }

    return result;
  }, [projectStats, unassignedStats]);

  const filteredStats = useMemo(() => {
    let filteredCalls = calls;
    if (selectedMonth && selectedMonth !== 'all') {
      filteredCalls = calls.filter(call => {
        const callDate = parse(call.formattedtime.split(',')[0], 'dd.MM.yyyy', new Date());
        return format(callDate, 'yyyy-MM') === selectedMonth;
      });
    }
    
    if (activeTab === 'all') {
      return calculateStats(filteredCalls);
    }
    return calculateStats(filteredCalls).filter(stat => stat.id.toString() === activeTab);
  }, [activeTab, calls, selectedMonth, calculateStats]);

  if (error) {
    console.error('Fehler:', error);
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-sm border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white">Fehler beim Laden der Daten</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300">{error}</p>
            <p className="text-gray-400 mt-2">Bitte überprüfen Sie:</p>
            <ul className="list-disc list-inside text-gray-400 mt-2">
              <li>Ihre Internetverbindung</li>
              <li>Ob Sie angemeldet sind</li>
              <li>Ob Projekte angelegt wurden</li>
              <li>Ob Anrufe importiert wurden</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <header className="bg-gray-800/50 backdrop-blur-sm shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Monatliche Statistik</h1>
          <Link href="/dashboard">
            <Button variant="outline" className="bg-white/10 text-white hover:bg-white/20 transition-colors duration-300">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="bg-white/10 backdrop-blur-sm border-gray-700">
          <CardHeader className="border-b border-gray-700">
            <CardTitle className="text-2xl font-bold text-white">Anrufe verwalten</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-[200px] bg-gray-700 text-white border-gray-600">
                  <SelectValue placeholder="Monat auswählen" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 text-white border-gray-700">
                  <SelectItem value="all">Alle Monate</SelectItem>
                  {monthOptions.map((month) => (
                    <SelectItem key={month} value={month}>
                      {format(parse(month, 'yyyy-MM', new Date()), 'MMMM yyyy', { locale: de })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList key="tabsList" className="bg-gray-800 p-1 rounded-lg flex flex-wrap gap-2">
                <TabsTrigger 
                  value="all"
                  className="px-4 py-2 rounded-md text-sm font-medium transition-colors data-[state=active]:bg-white data-[state=active]:text-gray-800"
                >
                  Alle Anrufe
                </TabsTrigger>
                {activeStats.map(stat => (
                  <TabsTrigger 
                    key={`tab-${stat.id}`} 
                    value={stat.id.toString()} 
                    className="px-4 py-2 rounded-md text-sm font-medium transition-colors data-[state=active]:bg-white data-[state=active]:text-gray-800"
                  >
                    {stat.display_name}
                  </TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value="all">
                <div className="overflow-x-auto rounded-lg border border-gray-700">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-gray-700">
                        <TableHead className="text-white">Projekt</TableHead>
                        <TableHead className="text-white">Gesamtanrufe</TableHead>
                        <TableHead className="text-white">Abrechenbare Anrufe</TableHead>
                        <TableHead className="text-white">Gesamtdauer</TableHead>
                        <TableHead className="text-white">Gesamtverdienst</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStats.map(stat => (
                        <TableRow key={`row-${stat.id}`} className="border-b border-gray-700">
                          <TableCell className="font-medium text-white">{stat.display_name}</TableCell>
                          <TableCell className="text-white">{stat.totalCalls}</TableCell>
                          <TableCell className="text-white">{stat.billableCalls}</TableCell>
                          <TableCell className="text-white">{formatDuration(stat.totalDuration)}</TableCell>
                          <TableCell className="text-white">{formatCurrency(stat.totalEarnings)}</TableCell>
                        </TableRow>
                      ))}
                      {totalStats && (
                        <TableRow className="font-bold border-t border-gray-700">
                          <TableCell className="text-white">Gesamt</TableCell>
                          <TableCell className="text-white">{totalStats.totalCalls}</TableCell>
                          <TableCell className="text-white">{totalStats.billableCalls}</TableCell>
                          <TableCell className="text-white">{formatDuration(totalStats.totalDuration)}</TableCell>
                          <TableCell className="text-white">{formatCurrency(totalStats.totalEarnings)}</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              {filteredStats.map(stat => (
                <TabsContent key={stat.id} value={stat.id.toString()}>
                  <div className="space-y-6">
                    <Card className="bg-white/10 backdrop-blur-sm border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-xl font-bold text-white">{stat.display_name} - Übersicht</CardTitle>
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
                            ]}
                          />
                          <StatCard
                            icon={<Euro className="h-6 w-6 text-yellow-400" />}
                            title="Finanzielle Übersicht"
                            items={[
                              { label: "Gesamtverdienst", value: formatCurrency(stat.totalEarnings) },
                            ]}
                          />
                          {stat.id !== 'unassigned' && 'payment_model' in stat && (
                            <StatCard
                              icon={<PieChart className="h-6 w-6 text-purple-400" />}
                              title="Vergütungsmodell"
                              items={[
                                { label: "Modell", value: stat.payment_model === 'custom' ? 'Benutzerdefiniert' : 
                                                       stat.payment_model === 'perMinute' ? 'Pro Minute' : 
                                                       stat.payment_model === 'perCall' ? 'Pro Anruf' : 'Unbekannt' },
                                ...(stat.payment_model === 'custom' ? 
                                  stat.custom_rates?.map((rate) => ({
                                    label: `${rate.minDuration} - ${rate.maxDuration} Sek.`,
                                    value: formatCurrency(rate.rate),
                                  })) || [] : 
                                  stat.payment_model === 'perMinute' ? 
                                  [{ label: "Vergütung pro Minute", value: formatCurrency(stat.per_minute_rate || 0) }] :
                                  stat.payment_model === 'perCall' ? 
                                  [{ label: "Vergütung pro Anruf", value: formatCurrency(stat.per_call_rate || 0) }] : 
                                  []
                                ),
                                { label: "Mindestdauer für Abrechnung", value: `${stat.min_duration} Sek.` },
                                { label: "Minuten aufrunden", value: stat.round_up_minutes ? 'Ja' : 'Nein' },
                              ]}
                            />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-white/10 backdrop-blur-sm border-gray-700">
                      <CardHeader>
                        <CardTitle className="text-xl font-bold text-white">Anrufverteilung nach Dauer</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {Object.entries(stat.durationDistribution).map(([category, count]) => (
                            <div key={category} className="bg-white/10 p-4 rounded-lg shadow">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-medium text-white">{category}</span>
                                <span className="text-sm text-gray-300">
                                  {count} Anrufe ({((count / stat.totalCalls) * 100).toFixed(1)}%)
                                </span>
                              </div>
                              <Progress value={(count / stat.totalCalls) * 100} className="h-2" />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    
                    {stat.id !== 'unassigned' && 'payment_model' in stat && stat.payment_model === 'custom' && (
                      <Card className="bg-white/10 backdrop-blur-sm border-gray-700">
                        <CardHeader>
                          <CardTitle className="text-xl font-bold text-white">Vergütung nach Anrufdauer</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <Select
                              value={selectedDurationFilter}
                              onValueChange={setSelectedDurationFilter}
                            >
                              <SelectTrigger className="w-full bg-gray-700 text-white border-gray-600">
                                <SelectValue placeholder="Wählen Sie einen Zeitraum" />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-800 text-white border-gray-700">
                                <SelectItem value="all" className="py-2 px-4 hover:bg-gray-700">Alle Anrufe</SelectItem>
                                {stat.earningsDistribution.map((dist, index) => (
                                  <SelectItem 
                                    key={index} 
                                    value={dist.range} 
                                    className="py-2 px-4 hover:bg-gray-700 whitespace-nowrap"
                                  >
                                    {dist.range}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <div className="overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow className="border-b border-gray-700">
                                    <TableHead className="text-white">Dauer</TableHead>
                                    <TableHead className="text-white">Anzahl Anrufe</TableHead>
                                    <TableHead className="text-white">Gesamtverdienst</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {stat.earningsDistribution
                                    .filter(dist => selectedDurationFilter === 'all' || selectedDurationFilter === dist.range)
                                    .map((dist, index) => (
                                      <TableRow key={index} className="border-b border-gray-700">
                                        <TableCell className="text-white">{dist.range}</TableCell>
                                        <TableCell className="text-white">{dist.count}</TableCell>
                                        <TableCell className="text-white">{formatCurrency(dist.earnings)}</TableCell>
                                      </TableRow>
                                    ))
                                  }
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

function StatCard({ icon, title, items }: {icon: React.ReactNode; title: string; items: {label: string; value: string | number}[]}) {
  return (
    <Card className="overflow-hidden bg-white/10 backdrop-blur-sm border-gray-700">
      <CardHeader className="bg-gray-800 border-b border-gray-700">
        <CardTitle className="text-lg font-semibold flex items-center text-white">
          {icon}
          <span className="ml-2">{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-gray-700">
          {items.map((item, index) => (
            <li key={index} className="flex justify-between items-center p-4 hover:bg-gray-700">
              <span className="text-sm font-medium text-gray-300">{item.label}</span>
              <span className="text-sm font-semibold text-white">{item.value}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

