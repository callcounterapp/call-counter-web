'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "./ui/select"
import { Progress } from "./ui/progress"
import { Euro, Clock, PhoneCall, PieChart, BarChart } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useToast } from "./ui/use-toast"
import { useAuth } from '../contexts/AuthContext'

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

export default function CallStats() {
  const [calls, setCalls] = useState<Call[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string>('')
  const [activeTab, setActiveTab] = useState('all')
  const [selectedDurationFilter, setSelectedDurationFilter] = useState('all')

  const { toast } = useToast()
  const { user } = useAuth()

  const parseDuration = (formattedduration: string): number => {
    if (!formattedduration) return 0;
    const [minutes, seconds] = formattedduration.split(':').map(Number);
    return (minutes * 60) + (seconds || 0);
  }

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
        console.log('Raw projects data:', projectsData);

        const { data: callsData, error: callsError } = await supabase
          .from('calls')
          .select('*')
          .eq('user_id', user.id);
        
        if (callsError) throw callsError;
        console.log('Raw calls data:', callsData);
        
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

        const debugText = `
          Found ${processedProjects.length || 0} projects and ${processedCalls.length || 0} calls for user ${user.id}
          
          Projects:
          ${processedProjects?.map(p => `
            ${p.display_name || p.internal_name || 'Unnamed'}:
            - ID: ${p.id}
            - Internal Name: ${p.internal_name}
            - Payment Model: ${p.payment_model}
            - Per Minute Rate: ${p.per_minute_rate}
            - Per Call Rate: ${p.per_call_rate}
            - Min Duration: ${p.min_duration}
            - Custom Rates: ${JSON.stringify(p.custom_rates)}
          `).join('\n')}
          
          Sample Calls:
          ${processedCalls.slice(0, 3).map(c => `
            ${c.name}: Duration ${c.Duration}s (from ${c.formattedduration}), Internal Name: ${c.internal_name}
          `).join('\n')}
        `;
        
        setDebugInfo(debugText);
        setCalls(processedCalls);
        setProjects(processedProjects);
        console.log('Processed projects:', processedProjects);
        console.log('Processed calls:', processedCalls);
        
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Fehler beim Laden der Daten');
      } finally {
        setLoading(false);
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

  const calculateEarnings = useCallback((call: Call, project: Project): number => {
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
        if (project.custom_rates?.length > 0) {
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
  }, []);

  const getProjectForCall = useCallback((call: Call): Project | undefined => {
    if (!call.internal_name) {
      console.log(`Call ${call.id} has no internal_name`);
      return undefined;
    }
    const project = projects.find(project => call.internal_name === project.internal_name);
    console.log(`Looking for project with internal_name ${call.internal_name}:`, project);
    return project;
  }, [projects]);

  const getDurationCategory = useCallback((duration: number): string => {
    if (duration < 30) return '0-30 Sek.'
    if (duration < 60) return '31-60 Sek.'
    if (duration < 120) return '1-2 Min.'
    if (duration < 300) return '2-5 Min.'
    return '5+ Min.'
  }, []);

  const projectStats = useMemo(() => {
    console.log('Calculating project stats with:', { calls, projects, userId: user?.id });
    const userCalls = calls.filter(call => call.user_id === user?.id);
    const userProjects = projects.filter(project => project.user_id === user?.id);
    console.log('Filtered user calls:', userCalls);
    console.log('Filtered user projects:', userProjects);

    return userProjects.map(project => {
      const projectCalls = userCalls.filter(call => {
        const matches = call.internal_name === project.internal_name;
        console.log(`Checking call ${call.id} (${call.internal_name}) against project ${project.internal_name}:`, matches);
        return matches;
      });
      console.log(`Found ${projectCalls.length} calls for project ${project.internal_name}`);

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

      console.log(`Project ${project.display_name || project.internal_name}: Total Calls: ${totalCalls}, Billable Calls: ${billableCalls}, Total Earnings: ${totalEarnings}`);

      const durationDistribution = projectCalls.reduce((acc, call) => {
        const category = getDurationCategory(call.Duration || 0)
        acc[category] = (acc[category] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const earningsDistribution = project.custom_rates ? project.custom_rates.map((rate: { minDuration: number; maxDuration: number; rate: number }) => ({
        range: `${rate.minDuration}-${rate.maxDuration} Sek.`,
        count: projectCalls.filter(call => call.Duration >= rate.minDuration && call.Duration <= rate.maxDuration).length,
        earnings: projectCalls.filter(call => call.Duration >= rate.minDuration && call.Duration <= rate.maxDuration)
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
  }, [calls, user, calculateEarnings, getDurationCategory]);

  const unassignedStats = useMemo(() => {
    const userCalls = calls.filter(call => call.user_id === user?.id);
    const unassignedCalls = userCalls.filter(call => !getProjectForCall(call))
    console.log('Unassigned calls:', unassignedCalls);
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
      }, {} as Record<string, number>)
    }
  }, [calls, user, getProjectForCall, getDurationCategory]);

  const totalStats = useMemo(() => ({
    totalCalls: calls.filter(call => call.user_id === user?.id).length,
    billableCalls: projectStats.reduce((sum, stat) => sum + stat.billableCalls, 0),
    totalEarnings: projectStats.reduce((sum, stat) => sum + stat.totalEarnings, 0),
    totalDuration: calls.filter(call => call.user_id === user?.id).reduce((sum, call) => sum + (call.Duration || 0), 0),
  }), [calls, projectStats, user]);

  const activeStats = useMemo(() => {
    const projectsWithCalls = projectStats
      .filter(stat => stat.totalCalls > 0)
      .map(stat => ({
        ...stat,
        display_name: stat.display_name || stat.internal_name || 'Unbenanntes Projekt'
      }));

    if (unassignedStats.totalCalls > 0) {
      projectsWithCalls.push(unassignedStats);
    }

    console.log('Active stats:', projectsWithCalls);
    return projectsWithCalls;
  }, [projectStats, unassignedStats]);

  if (loading) return <div>Lade Statistiken...</div>
  if (error) {
    toast({
      variant: "destructive",
      title: "Fehler beim Laden der Daten",
      description: error,
    })
    return <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
      <h2 className="text-lg font-semibold mb-2">Fehler beim Laden der Daten</h2>
      <p>{error}</p>
    </div>
  }

  return (
    <div>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap bg-gray-100 p-4 rounded">
            {debugInfo}
          </pre>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="bg-gray-100 border-b border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <CardTitle className="text-2xl font-bold flex items-center text-gray-800">
              <BarChart className="mr-2" />
              Anrufstatistik
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-gray-100 p-1 rounded-lg flex flex-wrap gap-2">
              <TabsTrigger 
                value="all"
                className="px-4 py-2 rounded-md text-sm font-medium transition-colors data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Alle Anrufe
              </TabsTrigger>
              {activeStats.map(stat => (
                <TabsTrigger 
                  key={stat.id} 
                  value={stat.id.toString()} 
                  className="px-4 py-2 rounded-md text-sm font-medium transition-colors data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  {stat.display_name}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="all">
              <Table>
                <TableHeader className="bg-gray-100">
                  <TableRow>
                    <TableHead className="w-[200px]">Projekt</TableHead>
                    <TableHead>Gesamtanrufe</TableHead>
                    <TableHead>Abrechenbare Anrufe</TableHead>
                    <TableHead>Gesamtdauer</TableHead>
                    <TableHead>Gesamtverdienst</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeStats.map(stat => (
                    <TableRow key={stat.id}>
                      <TableCell className="font-medium">{stat.display_name}</TableCell>
                      <TableCell>{stat.totalCalls}</TableCell>
                      <TableCell>{stat.billableCalls}</TableCell>
                      <TableCell>{formatDuration(stat.totalDuration)}</TableCell>
                      <TableCell>{formatCurrency(stat.totalEarnings)}</TableCell>
                    </TableRow>
                  ))}
                  {totalStats && (
                    <TableRow className="font-bold">
                      <TableCell>Gesamt</TableCell>
                      <TableCell>{totalStats.totalCalls}</TableCell>
                      <TableCell>{totalStats.billableCalls}</TableCell>
                      <TableCell>{formatDuration(totalStats.totalDuration)}</TableCell>
                      <TableCell>{formatCurrency(totalStats.totalEarnings)}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>
            {activeStats.map(stat => (
              <TabsContent key={stat.id} value={stat.id.toString()}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl font-bold">{stat.display_name} - Detaillierte Statistiken</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <StatCard
                        icon={<PhoneCall className="h-6 w-6 text-blue-500" />}
                        title="Anrufübersicht"
                        items={[
                          { label: "Gesamtanrufe", value: stat.totalCalls },
                          { label: "Abrechenbare Anrufe", value: stat.billableCalls },
                          { label: "Nicht abrechenbare Anrufe", value: stat.totalCalls - stat.billableCalls },
                        ]}
                      />
                      <StatCard
                        icon={<Clock className="h-6 w-6 text-green-500" />}
                        title="Zeitstatistiken"
                        items={[
                          { label: "Gesamtdauer", value: formatDuration(stat.totalDuration) },
                        ]}
                      />
                      <StatCard
                        icon={<Euro className="h-6 w-6 text-yellow-500" />}
                        title="Finanzielle Übersicht"
                        items={[
                          { label: "Gesamtverdienst", value: formatCurrency(stat.totalEarnings) },
                        ]}
                      />
                      {stat.id !== 'unassigned' && (
                        <StatCard
                          icon={<PieChart className="h-6 w-6 text-purple-500" />}
                          title="Vergütungsmodell"
                          items={[
                            { label: "Modell", value: stat.payment_model === 'custom' ? 'Benutzerdefiniert' : 
                                                   stat.payment_model === 'perMinute' ? 'Pro Minute' : 
                                                   stat.payment_model === 'perCall' ? 'Pro Anruf' : 'Unbekannt' },
                            ...(stat.payment_model === 'custom' ? 
                              stat.custom_rates?.map((rate: { minDuration: number; maxDuration: number; rate: number }) => ({
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
                    <div className="mt-8">
                      <h3 className="text-xl font-semibold mb-4">Anrufverteilung nach Dauer</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Object.entries(stat.durationDistribution).map(([category, count]) => (
                          <div key={category} className="bg-white p-4 rounded-lg shadow">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium">{category}</span>
                              <span className="text-sm text-gray-600">
                                {count} Anrufe ({((count as number / stat.totalCalls) * 100).toFixed(1)}%)
                              </span>
                            </div>
                            <Progress value={(count as number / stat.totalCalls) * 100} className="h-2" />
                          </div>
                        ))}
                      </div>
                    </div>
                    {stat.id !== 'unassigned' && stat.payment_model === 'custom' && (
                      <div className="mt-8">
                        <h3 className="text-xl font-semibold mb-4">Vergütung nach Anrufdauer</h3>
                        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                          <div className="p-4 bg-gray-50 border-b">
                            <Select
                              value={selectedDurationFilter}
                              onValueChange={setSelectedDurationFilter}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Wählen Sie einen Zeitraum" />
                              </SelectTrigger>
                              <SelectContent className="bg-white border rounded-md shadow-md">
                                <SelectItem value="all" className="py-2 px-4 hover:bg-gray-100">Alle Anrufe</SelectItem>
                                {stat.earningsDistribution.map((dist, index) => (
                                  <SelectItem 
                                    key={index} 
                                    value={dist.range} 
                                    className="py-2 px-4 hover:bg-gray-100 whitespace-nowrap"
                                  >
                                    {dist.range}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-gray-100">
                                  <TableHead className="py-3 px-4 text-left font-semibold text-gray-700">Dauer</TableHead>
                                  <TableHead className="py-3 px-4 text-left font-semibold text-gray-700">Anzahl Anrufe</TableHead>
                                  <TableHead className="py-3 px-4 text-left font-semibold text-gray-700">Gesamtverdienst</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {stat.earningsDistribution
                                  .filter(dist => selectedDurationFilter === 'all' || selectedDurationFilter === dist.range)
                                  .map((dist, index) => (
                                    <TableRow key={index} className="border-b last:border-b-0 hover:bg-gray-50">
                                      <TableCell className="py-4 px-4 text-sm font-medium text-gray-900">{dist.range}</TableCell>
                                      <TableCell className="py-4 px-4 text-sm text-gray-700">{dist.count}</TableCell>
                                      <TableCell className="py-4 px-4 text-sm text-gray-700">{formatCurrency(dist.earnings)}</TableCell>
                                    </TableRow>
                                  ))
                                }
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({ icon, title, items }: {icon: React.ReactNode; title: string; items: {label: string; value: string | number}[]}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gray-50 border-b">
        <CardTitle className="text-lg font-semibold flex items-center text-gray-800">
          {icon}
          <span className="ml-2">{title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y">
          {items.map((item, index) => (
            <li key={index} className="flex justify-between items-center p-4 hover:bg-gray-50">
              <span className="text-sm font-medium text-gray-600">{item.label}</span>
              <span className="text-sm font-semibold text-gray-900">{item.value}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

